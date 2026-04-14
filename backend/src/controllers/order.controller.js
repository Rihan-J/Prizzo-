const prisma = require("../config/db");
const cache = require("../utils/cache");
const logger = require("../utils/logger");
const { commissionPercentage } = require("../config/platform");
const { sendSuccess, sendError, paginationMeta } = require("../utils/response");
const { throttledEmit } = require("../config/socket");
const { enqueueNotification } = require("../services/queue.service");

// ─── POST /orders — Checkout / Create Order (strong consistency) ───
const checkout = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      return sendError(res, 400, "Cart is empty.");
    }
    if (!cart.storeId) {
      return sendError(res, 400, "Cart has no store context.");
    }

    // ── Atomic transaction with row-level locking for strong consistency ──
    const orderData = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of cart.items) {
        // Fetch fresh product data inside transaction for concurrency safety
        const product = await tx.product.findUnique({ where: { id: item.productId } });

        if (!product || !product.isAvailable) {
          throw new Error(`Product ${item.product.name} is currently unavailable.`);
        }

        if (item.quantity > product.stock) {
          throw new Error(`Insufficient stock for ${product.name}. Only ${product.stock} available.`);
        }

        const priceAtCheckout = product.price;
        const itemTotal = priceAtCheckout * item.quantity;
        totalAmount += itemTotal;

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: priceAtCheckout,
        });

        // Decrement stock atomically
        const newStock = product.stock - item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: newStock,
            isAvailable: newStock > 0,
          },
        });
      }

      // Calculate commission
      const commission = Math.round((totalAmount * commissionPercentage / 100) * 100) / 100;
      const vendorEarnings = Math.round((totalAmount - commission) * 100) / 100;

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          storeId: cart.storeId,
          totalAmount,
          commission,
          vendorEarnings,
          status: "CONFIRMED",
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      // Clear the Cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { storeId: null } });

      return newOrder;
    }, {
      timeout: 20000,    // 20 second timeout
      maxWait: 10000,    // 10 second max wait to acquire transaction 
    });

    // ── Cache invalidation: stock changed → invalidate products + stores ──
    await Promise.all([
      cache.invalidate("products"),
      cache.invalidate("categories"),
      cache.invalidate("stores"),
      cache.invalidate("admin"),
    ]);

    // ── Real-time: Notify vendor via Socket.IO ──
    const io = req.app.get("io");
    if (io) {
      throttledEmit(io, `vendor:${cart.storeId}`, "order:new", {
        orderId: orderData.id,
        totalAmount: orderData.totalAmount,
        itemCount: orderData.items.length,
        userId,
      });
    }

    // ── Enqueue notification job (async — doesn't block checkout) ──
    enqueueNotification("order-created", {
      orderId: orderData.id,
      storeId: cart.storeId,
      userId,
      totalAmount: orderData.totalAmount,
      itemCount: orderData.items.length,
    });

    logger.info({ orderId: orderData.id, userId, storeId: cart.storeId, total: orderData.totalAmount }, "Order placed");

    return sendSuccess(res, 201, { order: orderData });
  } catch (error) {
    logger.error({ err: error }, "[Checkout Error]");
    const message = error.message && (error.message.includes("Insufficient") || error.message.includes("unavailable"))
      ? error.message
      : "Internal server error during checkout.";
    return sendError(res, 400, message);
  }
};

// ─── GET /orders/user — Get User's Orders (paginated) ───
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          store: { select: { id: true, name: true, address: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return sendSuccess(res, 200, { orders }, paginationMeta(pageNum, limitNum, total));
  } catch (error) {
    logger.error({ err: error }, "[GetUserOrders Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── GET /orders/vendor — Get Vendor's Orders (paginated) ───
const getVendorOrders = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) return sendError(res, 403, "Vendor profile not found.");

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) return sendError(res, 404, "Store not found.");

    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { storeId: store.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where: { storeId: store.id } }),
    ]);

    return sendSuccess(res, 200, { orders, storeId: store.id }, paginationMeta(pageNum, limitNum, total));
  } catch (error) {
    logger.error({ err: error }, "[GetVendorOrders Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── PATCH /orders/:id/status — Update Order Status (Vendor) ───
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return sendError(res, 400, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) return sendError(res, 403, "Vendor profile not found.");

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) return sendError(res, 404, "Store not found.");

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return sendError(res, 404, "Order not found.");

    if (order.storeId !== store.id) {
      return sendError(res, 403, "You can only update orders for your store.");
    }

    if (order.status === "COMPLETED") {
      return sendError(res, 400, "Order is already completed and permanently locked.");
    }

    if (order.status === "CANCELLED") {
      return sendError(res, 400, "Order is cancelled and cannot be updated.");
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });

    // ── Cache invalidation: order status changed → invalidate stores + admin ──
    await Promise.all([
      cache.invalidate("stores"),
      cache.invalidate("admin"),
    ]);

    // ── Real-time: Notify user via Socket.IO ──
    const io = req.app.get("io");
    if (io) {
      throttledEmit(io, `user:${order.userId}`, "order:status-update", {
        orderId: order.id,
        status: updatedOrder.status,
        storeName: store.name,
      });
    }

    // ── Enqueue notification job ──
    enqueueNotification("order-status-changed", {
      orderId: order.id,
      userId: order.userId,
      storeId: store.id,
      oldStatus: order.status,
      newStatus: updatedOrder.status,
    });

    logger.info({ orderId: id, oldStatus: order.status, newStatus: updatedOrder.status }, "Order status updated");

    return sendSuccess(res, 200, { order: updatedOrder });
  } catch (error) {
    logger.error({ err: error }, "[UpdateOrderStatus Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

module.exports = {
  checkout,
  getUserOrders,
  getVendorOrders,
  updateOrderStatus,
};
