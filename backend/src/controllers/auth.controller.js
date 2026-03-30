const bcrypt = require("bcrypt");
const prisma = require("../config/db");
const { generateToken } = require("../services/jwt.service");

// ─── POST /auth/register ───
const register = async (req, res) => {
  try {
    const { name, email, password, role, storeName } = req.body;

    // ── Input validation ──
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const validRoles = ["USER", "VENDOR"];
    const requestedRole = role ? role.toUpperCase() : "USER";

    // Block ADMIN self-registration — admins must be created via the secure script
    if (requestedRole === "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin accounts cannot be created through registration." });
    }

    const userRole = validRoles.includes(requestedRole) ? requestedRole : "USER";

    if (userRole === "VENDOR" && (!storeName || storeName.trim().length < 2)) {
      return res.status(400).json({ success: false, message: "Store name is required for vendor registration (min 2 chars)." });
    }

    // ── Check if user already exists ──
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    // ── Hash password ──
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ── Create user (and vendor if applicable) ──
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: userRole,
        ...(userRole === "VENDOR" && {
          vendor: {
            create: {
              storeName: storeName.trim(),
            },
          },
        }),
      },
      include: {
        vendor: userRole === "VENDOR",
      },
    });

    // ── Generate JWT ──
    const token = generateToken({ userId: user.id, role: user.role });

    // ── Response (never expose password) ──
    const { password: _, ...userData } = user;

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("[Register Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── POST /auth/login ───
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Input validation ──
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // ── Find user ──
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { vendor: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // ── Compare password ──
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // ── Generate JWT ──
    const token = generateToken({ userId: user.id, role: user.role });

    // ── Response ──
    const { password: _, ...userData } = user;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("[Login Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /auth/me ───
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { vendor: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const { password: _, ...userData } = user;

    return res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("[GetMe Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = { register, login, getMe };
