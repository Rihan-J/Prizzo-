const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cart.controller");

// ─── Protected Routes (USER only) ───
router.use(authenticate);
router.use(authorize("USER"));

router.get("/", getCart);
router.post("/add", addToCart);
router.patch("/item/:id", updateCartItem);
router.delete("/item/:id", removeCartItem);
router.delete("/clear", clearCart);

module.exports = router;
