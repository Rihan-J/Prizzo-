const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const {
  checkout,
  getUserOrders,
  getVendorOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");

// All routes require authentication
router.use(authenticate);

// ─── USER Routes ───
router.post("/", authorize("USER"), checkout);
router.get("/user", authorize("USER"), getUserOrders);

// ─── VENDOR Routes ───
router.get("/vendor", authorize("VENDOR"), getVendorOrders);
router.patch("/:id/status", authorize("VENDOR"), updateOrderStatus);

module.exports = router;
