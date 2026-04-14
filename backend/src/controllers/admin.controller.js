const prisma = require("../config/db");
const bcrypt = require("bcrypt");
const cache = require("../utils/cache");
const logger = require("../utils/logger");
const { commissionPercentage } = require("../config/platform");
const { sendSuccess, sendError, paginationMeta } = require("../utils/response");
const { enqueueAnalytics } = require("../services/queue.service");

// ─── GET /admin/vendors — List All Vendors ───
const getAllVendors = async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        store: { select: { id: true, name: true, address: true } },
      },
      orderBy: { user: { createdAt: "desc" } },
    });

    return sendSuccess(res, 200, { vendors, count: vendors.length });
  } catch (error) {
    logger.error({ err: error }, "[Admin GetAllVendors Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── PATCH /admin/vendors/:id/approve — Approve Vendor ───
const approveVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) return sendError(res, 404, "Vendor not found.");
    if (vendor.isVerified) return sendError(res, 400, "Vendor is already approved.");

    const updated = await prisma.vendor.update({
      where: { id },
      data: { isVerified: true, isBlocked: false },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    logger.info({ vendorId: id }, "Vendor approved");
    return sendSuccess(res, 200, { vendor: updated, message: `Vendor "${updated.storeName}" has been approved.` });
  } catch (error) {
    logger.error({ err: error }, "[Admin ApproveVendor Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── PATCH /admin/vendors/:id/reject — Reject Vendor ───
const rejectVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) return sendError(res, 404, "Vendor not found.");

    const updated = await prisma.vendor.update({
      where: { id },
      data: { isVerified: false },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    logger.info({ vendorId: id }, "Vendor rejected");
    return sendSuccess(res, 200, { vendor: updated, message: `Vendor "${updated.storeName}" has been rejected.` });
  } catch (error) {
    logger.error({ err: error }, "[Admin RejectVendor Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── PATCH /admin/vendors/:id/block — Block/Unblock Vendor ───
const blockVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) return sendError(res, 404, "Vendor not found.");

    const updated = await prisma.vendor.update({
      where: { id },
      data: { isBlocked: !vendor.isBlocked },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    logger.info({ vendorId: id, blocked: updated.isBlocked }, "Vendor block toggled");
    return sendSuccess(res, 200, {
      vendor: updated,
      message: updated.isBlocked
        ? `Vendor "${updated.storeName}" has been blocked.`
        : `Vendor "${updated.storeName}" has been unblocked.`,
    });
  } catch (error) {
    logger.error({ err: error }, "[Admin BlockVendor Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── GET /admin/stores — List All Stores ───
const getAllStores = async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        vendor: { select: { id: true, storeName: true, isVerified: true, isBlocked: true } },
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, 200, { stores, count: stores.length });
  } catch (error) {
    logger.error({ err: error }, "[Admin GetAllStores Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── GET /admin/products — List All Products (paginated) ───
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, storeId } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (category) where.category = category.toLowerCase();
    if (storeId) where.storeId = storeId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { store: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    return sendSuccess(res, 200, { products }, paginationMeta(pageNum, limitNum, total));
  } catch (error) {
    logger.error({ err: error }, "[Admin GetAllProducts Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── DELETE /admin/products/:id — Delete a Product ───
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return sendError(res, 404, "Product not found.");

    await prisma.product.delete({ where: { id } });

    // ── Cache invalidation: product deleted ──
    await Promise.all([
      cache.invalidate("products"),
      cache.invalidate("categories"),
      cache.invalidate(`product:${id}`),
      cache.invalidate("admin"),
    ]);

    logger.info({ productId: id }, "Admin deleted product");
    return sendSuccess(res, 200, { message: "Product removed successfully." });
  } catch (error) {
    logger.error({ err: error }, "[Admin DeleteProduct Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── GET /admin/orders — List All Orders (paginated) ───
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status.toUpperCase();

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          store: { select: { id: true, name: true } },
          items: {
            include: { product: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    return sendSuccess(res, 200, { orders }, paginationMeta(pageNum, limitNum, total));
  } catch (error) {
    logger.error({ err: error }, "[Admin GetAllOrders Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── GET /admin/dashboard — Dashboard Stats (cached 30s) ───
const getDashboardStats = async (req, res) => {
  try {
    const cacheKey = "admin:dashboard";
    const cached = await cache.get(cacheKey);
    if (cached) return sendSuccess(res, 200, cached);

    const [
      totalUsers, totalVendors, pendingVendors, blockedVendors,
      totalStores, totalProducts, totalOrders,
      revenueResult, commissionResult, vendorEarningsResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isVerified: false, isBlocked: false } }),
      prisma.vendor.count({ where: { isBlocked: true } }),
      prisma.store.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.order.aggregate({ _sum: { commission: true } }),
      prisma.order.aggregate({ _sum: { vendorEarnings: true } }),
    ]);

    const stats = {
      totalUsers, totalVendors, pendingVendors, blockedVendors,
      totalStores, totalProducts, totalOrders,
      totalRevenue: revenueResult._sum.totalAmount || 0,
      totalCommission: commissionResult._sum.commission || 0,
      totalVendorEarnings: vendorEarningsResult._sum.vendorEarnings || 0,
      commissionPercentage,
    };

    await cache.set(cacheKey, { stats }, 30);

    // ── Enqueue background refresh for next request ──
    enqueueAnalytics("refresh-dashboard");

    return sendSuccess(res, 200, { stats });
  } catch (error) {
    logger.error({ err: error }, "[Admin Dashboard Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── PATCH /admin/users/:id/reset-password — Secure Vendor Password Reset ───
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // ── Validate password ──
    if (!newPassword || typeof newPassword !== "string") {
      return sendError(res, 400, "newPassword is required.");
    }
    if (newPassword.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters.");
    }

    // ── Validate user exists ──
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) {
      return sendError(res, 404, "User not found.");
    }

    // ── Validate user is a VENDOR ──
    if (user.role !== "VENDOR") {
      return sendError(res, 403, "Password reset is only allowed for vendor accounts.");
    }

    // ── Hash password (bcrypt, salt rounds 12) ──
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // ── Update password — never return password in response ──
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    logger.info({ targetUserId: id, role: user.role }, "Admin reset vendor password");

    // ── Return message at top-level for frontend compatibility ──
    return res.status(200).json({
      success: true,
      data: null,
      message: `Password for vendor "${user.name}" (${user.email}) has been reset successfully.`,
    });
  } catch (error) {
    logger.error({ err: error }, "[Admin ResetPassword Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── GET /admin/vendor-performance — Aggregation-based (no N+1) ───
const getVendorPerformance = async (req, res) => {
  try {
    const cacheKey = "admin:vendor-performance";
    const cached = await cache.get(cacheKey);
    if (cached) return sendSuccess(res, 200, cached);

    // ── Aggregation query instead of N+1 ──
    const [vendors, orderStats, completedStats, productCounts] = await Promise.all([
      prisma.vendor.findMany({
        include: {
          user: { select: { name: true, email: true } },
          store: { select: { id: true } },
        },
      }),
      // Aggregate all order financials by storeId in a single query
      prisma.order.groupBy({
        by: ["storeId"],
        _sum: { totalAmount: true, commission: true, vendorEarnings: true },
        _count: { id: true },
      }),
      // Aggregate completed orders by storeId
      prisma.order.groupBy({
        by: ["storeId"],
        where: { status: "COMPLETED" },
        _count: { id: true },
      }),
      // Aggregate product counts by storeId
      prisma.product.groupBy({
        by: ["storeId"],
        _count: { id: true },
      }),
    ]);

    // Build lookup maps for O(1) access
    const orderMap = new Map(orderStats.map(s => [s.storeId, s]));
    const completedMap = new Map(completedStats.map(s => [s.storeId, s._count.id]));
    const productMap = new Map(productCounts.map(s => [s.storeId, s._count.id]));

    const performance = vendors.map(v => {
      const storeId = v.store?.id;
      const stats = storeId ? orderMap.get(storeId) : null;

      return {
        vendorId: v.id,
        name: v.user.name,
        email: v.user.email,
        storeName: v.storeName,
        isVerified: v.isVerified,
        isBlocked: v.isBlocked,
        totalProducts: storeId ? (productMap.get(storeId) || 0) : 0,
        totalOrders: stats?._count?.id || 0,
        completedOrders: storeId ? (completedMap.get(storeId) || 0) : 0,
        totalSales: Math.round((stats?._sum?.totalAmount || 0) * 100) / 100,
        totalCommission: Math.round((stats?._sum?.commission || 0) * 100) / 100,
        totalEarnings: Math.round((stats?._sum?.vendorEarnings || 0) * 100) / 100,
      };
    });

    await cache.set(cacheKey, { performance }, 30);

    // ── Enqueue background refresh ──
    enqueueAnalytics("refresh-vendor-performance");

    return sendSuccess(res, 200, { performance });
  } catch (error) {
    logger.error({ err: error }, "[Admin VendorPerformance Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── PATCH /admin/stores/:id/verify-location — Verify Store Location ───
const verifyStoreLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return sendError(res, 404, "Store not found.");

    if (store.isLocationVerified) {
      return sendError(res, 400, "Store location is already verified.");
    }

    const updated = await prisma.store.update({
      where: { id },
      data: { isLocationVerified: true },
    });

    await cache.invalidate("stores");
    logger.info({ storeId: id }, "Admin verified store location");

    return sendSuccess(res, 200, {
      store: updated,
      message: `Location for "${updated.name}" has been verified.`,
    });
  } catch (error) {
    logger.error({ err: error }, "[Admin VerifyStoreLocation Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

module.exports = {
  getAllVendors, approveVendor, rejectVendor, blockVendor,
  getAllStores, getAllProducts, getAllOrders,
  getDashboardStats, resetUserPassword, getVendorPerformance, deleteProduct,
  verifyStoreLocation,
};
