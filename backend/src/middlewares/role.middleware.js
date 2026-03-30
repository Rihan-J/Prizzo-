/**
 * Role-based access control middleware.
 * Usage: authorize("VENDOR") or authorize("USER", "VENDOR")
 * Must be used AFTER authenticate middleware.
 *
 * @param  {...string} allowedRoles - Roles that are permitted access
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}.`,
      });
    }

    next();
  };
};

module.exports = authorize;
