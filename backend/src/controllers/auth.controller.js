const bcrypt = require("bcrypt");
const prisma = require("../config/db");
const logger = require("../utils/logger");
const { generateToken } = require("../services/jwt.service");
const { sendSuccess, sendError } = require("../utils/response");

// ─── POST /auth/register ───
const register = async (req, res) => {
  try {
    const { name, email, password, role, storeName } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, "Name, email, and password are required.");
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return sendError(res, 400, "Name must be at least 2 characters.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, "Invalid email format.");
    }

    if (password.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters.");
    }

    const validRoles = ["USER", "VENDOR"];
    const requestedRole = role ? role.toUpperCase() : "USER";

    if (requestedRole === "ADMIN") {
      return sendError(res, 403, "Admin accounts cannot be created through registration.");
    }

    const userRole = validRoles.includes(requestedRole) ? requestedRole : "USER";

    if (userRole === "VENDOR" && (!storeName || storeName.trim().length < 2)) {
      return sendError(res, 400, "Store name is required for vendor registration (min 2 chars).");
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return sendError(res, 409, "An account with this email already exists.");
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

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

    const token = generateToken({ userId: user.id, role: user.role });
    const { password: _, ...userData } = user;

    logger.info({ userId: user.id, role: user.role }, "New user registered");

    return sendSuccess(res, 201, { token, user: userData });
  } catch (error) {
    logger.error({ err: error }, "[Register Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── POST /auth/login ───
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, "Email and password are required.");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { vendor: true },
    });

    if (!user) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const token = generateToken({ userId: user.id, role: user.role });
    const { password: _, ...userData } = user;

    logger.info({ userId: user.id, role: user.role }, "User logged in");

    return sendSuccess(res, 200, { token, user: userData });
  } catch (error) {
    logger.error({ err: error }, "[Login Error]");
    return sendError(res, 500, "Internal server error.");
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
      return sendError(res, 404, "User not found.");
    }

    const { password: _, ...userData } = user;
    return sendSuccess(res, 200, { user: userData });
  } catch (error) {
    logger.error({ err: error }, "[GetMe Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

module.exports = { register, login, getMe };
