const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const checkVendorApproved = require("../middlewares/vendor-approval.middleware");
const {
  createStore,
  getVendorStore,
  updateStore,
  createProduct,
  getVendorProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/vendor.controller");

// All vendor routes require authentication + VENDOR role
router.use(authenticate);
router.use(authorize("VENDOR"));

// ─── Store Routes (allowed even before approval — vendor needs to set up store) ───
router.get("/store", getVendorStore);
router.post("/store", createStore);
router.patch("/store", updateStore);

// ─── Product Routes (require vendor approval) ───
router.post("/products", checkVendorApproved, createProduct);
router.get("/products", checkVendorApproved, getVendorProducts);
router.patch("/products/:id", checkVendorApproved, updateProduct);
router.delete("/products/:id", checkVendorApproved, deleteProduct);

module.exports = router;
