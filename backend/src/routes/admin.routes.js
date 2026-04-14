const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const {
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
  verifyStoreLocation,
} = require("../controllers/admin.controller");

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(authorize("ADMIN"));

// ─── Dashboard ───
router.get("/dashboard", getDashboardStats);

// ─── Vendor Management ───
router.get("/vendors", getAllVendors);
router.patch("/vendors/:id/approve", approveVendor);
router.patch("/vendors/:id/reject", rejectVendor);
router.patch("/vendors/:id/block", blockVendor);
router.get("/vendor-performance", getVendorPerformance);

// ─── Vendor Password Reset ───
router.patch("/users/:id/reset-password", resetUserPassword);

// ─── Platform Overview ───
router.get("/stores", getAllStores);
router.patch("/stores/:id/verify-location", verifyStoreLocation);
router.get("/products", getAllProducts);
router.delete("/products/:id", deleteProduct);
router.get("/orders", getAllOrders);

module.exports = router;
