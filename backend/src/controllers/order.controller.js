const prisma = require("../config/db");
const { commissionPercentage } = require("../config/platform");

// ─── POST /orders — Checkout / Create Order ───
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
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }
    if (!cart.storeId) {
      return res.status(400).json({ success: false, message: "Cart has no store context." });
    }

    // Process checkout in a Prisma Transaction
    const orderData = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of cart.items) {
        // Fetch fresh product data inside transaction to ensure concurrency safety
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

        // Decrement stock
        const newStock = product.stock - item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: newStock,
            isAvailable: newStock > 0, // Auto-mark unavailable if stock hits 0
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
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order: orderData,
    });
  } catch (error) {
    console.error("[Checkout Error]", error.message);
    const message = error.message && error.message.includes("Insufficient") || error.message.includes("unavailable")
      ? error.message 
      : "Internal server error during checkout.";
    
    return res.status(400).json({ success: false, message });
  }
};

// ─── GET /orders/user — Get User's Orders ───
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const orders = await prisma.order.findMany({
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
    });

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("[GetUserOrders Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /orders/vendor — Get Vendor's Orders ───
const getVendorOrders = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) return res.status(403).json({ success: false, message: "Vendor profile not found." });

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) return res.status(404).json({ success: false, message: "Store not found." });

    const orders = await prisma.order.findMany({
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
    });

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("[GetVendorOrders Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── PATCH /orders/:id/status — Update Order Status (Vendor) ───
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) return res.status(403).json({ success: false, message: "Vendor profile not found." });

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) return res.status(404).json({ success: false, message: "Store not found." });

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    if (order.storeId !== store.id) {
      return res.status(403).json({ success: false, message: "You can only update orders for your store." });
    }

    if (order.status === "COMPLETED") {
      return res.status(400).json({ success: false, message: "Order is already completed and permanently locked." });
    }
    
    if (order.status === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Order is cancelled and cannot be updated." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });

    return res.status(200).json({ success: true, message: `Status updated to ${updatedOrder.status}`, order: updatedOrder });
  } catch (error) {
    console.error("[UpdateOrderStatus Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  checkout,
  getUserOrders,
  getVendorOrders,
  updateOrderStatus,
};
