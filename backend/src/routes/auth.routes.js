const express = require("express");
const router = express.Router();

const { register, login, getMe } = require("../controllers/auth.controller");
const authenticate = require("../middlewares/auth.middleware");

// ─── Public Routes ───
router.post("/register", register);
router.post("/login", login);

// ─── Protected Routes ───
router.get("/me", authenticate, getMe);

module.exports = router;
