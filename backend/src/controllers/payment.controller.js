const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sendSuccess, sendError } = require("../utils/response");
const logger = require("../utils/logger");
const prisma = require("../config/db");

let razorpayInstance = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

const createRazorpayOrder = async (req, res) => {
  try {
    if (!razorpayInstance) {
      return sendError(res, 500, "Razorpay is not configured on the server.");
    }

    const userId = req.user.userId;

    // Calculate cart total dynamically from DB to prevent tampering
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          where: { isSelected: true },
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return sendError(res, 400, "Cart is empty or no items selected.");
    }

    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += item.quantity * item.product.price;
    }

    // Include platform charges (e.g., 2%)
    const charges = Math.round(subtotal * 0.02);
    const totalAmount = subtotal + charges;

    // Razorpay amount is in paise (multiply by 100)
    const options = {
      amount: Math.round(totalAmount * 100), 
      currency: "INR",
      receipt: `receipt_cart_${cart.id.slice(0, 8)}`,
    };

    const order = await razorpayInstance.orders.create(options);
    
    return sendSuccess(res, 200, {
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    logger.error({ err: error }, "[Razorpay Order Error]");
    return sendError(res, 500, "Failed to create payment order.");
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(res, 400, "Missing payment verification parameters.");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      return sendSuccess(res, 200, { verified: true });
    } else {
      return sendError(res, 400, "Invalid payment signature.");
    }
  } catch (error) {
    logger.error({ err: error }, "[Razorpay Verify Error]");
    return sendError(res, 500, "Internal server error during verification.");
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
};
