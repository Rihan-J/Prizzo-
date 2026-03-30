const { verifyToken } = require("../services/jwt.service");

/**
 * Auth middleware — verifies Bearer token from Authorization header.
 * Attaches decoded user payload (userId, role) to req.user.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. Token is malformed." });
    }

    const decoded = verifyToken(token);
    req.user = decoded; // { userId, role, iat, exp }
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token has expired. Please login again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token." });
    }
    return res.status(500).json({ success: false, message: "Authentication failed." });
  }
};

module.exports = authenticate;
