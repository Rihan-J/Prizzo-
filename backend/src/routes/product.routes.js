const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  getCategories,
} = require("../controllers/product.controller");

// ─── Public Product Routes (no auth required) ───
router.get("/categories", getCategories);
router.get("/:id", getProductById);
router.get("/", getAllProducts);

module.exports = router;
