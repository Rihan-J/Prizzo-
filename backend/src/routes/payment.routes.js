const express = require("express");
const authenticate = require("../middlewares/auth.middleware");
const { createRazorpayOrder, verifyPayment } = require("../controllers/payment.controller");

const router = express.Router();

router.post("/razorpay-order", authenticate, createRazorpayOrder);
router.post("/verify", authenticate, verifyPayment);

module.exports = router;
