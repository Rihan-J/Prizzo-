const prisma = require("../config/db");
const bcrypt = require("bcrypt");
const { commissionPercentage } = require("../config/platform");

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

    return res.status(200).json({
      success: true,
      count: vendors.length,
      vendors,
    });
  } catch (error) {
    console.error("[Admin GetAllVendors Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── PATCH /admin/vendors/:id/approve — Approve Vendor ───
const approveVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found." });
    }

    if (vendor.isVerified) {
      return res.status(400).json({ success: false, message: "Vendor is already approved." });
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: { isVerified: true, isBlocked: false },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Vendor "${updated.storeName}" has been approved.`,
      vendor: updated,
    });
  } catch (error) {
    console.error("[Admin ApproveVendor Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── PATCH /admin/vendors/:id/reject — Reject Vendor ───
const rejectVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found." });
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: { isVerified: false },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Vendor "${updated.storeName}" has been rejected.`,
      vendor: updated,
    });
  } catch (error) {
    console.error("[Admin RejectVendor Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── PATCH /admin/vendors/:id/block — Block Vendor ───
const blockVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found." });
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: { isBlocked: !vendor.isBlocked },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: updated.isBlocked
        ? `Vendor "${updated.storeName}" has been blocked.`
        : `Vendor "${updated.storeName}" has been unblocked.`,
      vendor: updated,
    });
  } catch (error) {
    console.error("[Admin BlockVendor Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /admin/stores — List All Stores ───
const getAllStores = async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        vendor: {
          select: { id: true, storeName: true, isVerified: true, isBlocked: true },
        },
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: stores.length,
      stores,
    });
  } catch (error) {
    console.error("[Admin GetAllStores Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /admin/products — List All Products ───
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, storeId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (category) where.category = category.toLowerCase();
    if (storeId) where.storeId = storeId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          store: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      products,
    });
  } catch (error) {
    console.error("[Admin GetAllProducts Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── DELETE /admin/products/:id — Delete a Product ───
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    await prisma.product.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Product removed successfully." });
  } catch (error) {
    console.error("[Admin DeleteProduct Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /admin/orders — List All Orders ───
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status.toUpperCase();

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          store: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      orders,
    });
  } catch (error) {
    console.error("[Admin GetAllOrders Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /admin/dashboard — Dashboard Stats ───
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalVendors,
      pendingVendors,
      blockedVendors,
      totalStores,
      totalProducts,
      totalOrders,
      revenueResult,
      commissionResult,
      vendorEarningsResult,
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

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalVendors,
        pendingVendors,
        blockedVendors,
        totalStores,
        totalProducts,
        totalOrders,
        totalRevenue: revenueResult._sum.totalAmount || 0,
        totalCommission: commissionResult._sum.commission || 0,
        totalVendorEarnings: vendorEarningsResult._sum.vendorEarnings || 0,
        commissionPercentage,
      },
    });
  } catch (error) {
    console.error("[Admin Dashboard Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── POST /admin/reset-password/:userId — Reset User Password ───
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: `Password for user "${user.name}" (${user.email}) has been reset.`,
    });
  } catch (error) {
    console.error("[Admin ResetPassword Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /admin/vendor-performance — Vendor Performance ───
const getVendorPerformance = async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        user: { select: { name: true, email: true } },
        store: {
          include: {
            orders: {
              select: { totalAmount: true, commission: true, vendorEarnings: true, status: true },
            },
            _count: { select: { products: true } },
          },
        },
      },
    });

    const performance = vendors.map(v => {
      const orders = v.store?.orders || [];
      const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalCommission = orders.reduce((sum, o) => sum + o.commission, 0);
      const totalEarnings = orders.reduce((sum, o) => sum + o.vendorEarnings, 0);
      const completedOrders = orders.filter(o => o.status === "COMPLETED").length;

      return {
        vendorId: v.id,
        name: v.user.name,
        email: v.user.email,
        storeName: v.storeName,
        isVerified: v.isVerified,
        isBlocked: v.isBlocked,
        totalProducts: v.store?._count?.products || 0,
        totalOrders: orders.length,
        completedOrders,
        totalSales: Math.round(totalSales * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
      };
    });

    return res.status(200).json({ success: true, performance });
  } catch (error) {
    console.error("[Admin VendorPerformance Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  getAllVendors,
  approveVendor,
  rejectVendor,
  blockVendor,
  getAllStores,
  getAllProducts,
  getAllOrders,
  getDashboardStats,
  resetUserPassword,
  getVendorPerformance,
  deleteProduct,
};
