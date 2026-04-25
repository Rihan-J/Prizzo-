const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const { chat } = require("../controllers/chat.controller");

// ─── Protected Routes (USER only) ───
router.use(authenticate);
router.use(authorize("USER"));

router.post("/chat", chat);

module.exports = router;
