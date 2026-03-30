const prisma = require("../config/db");

/**
 * Vendor approval middleware.
 * Must be used AFTER authenticate + authorize("VENDOR").
 *
 * Checks:
 *  1. Vendor record exists for the logged-in user
 *  2. Vendor is not blocked by admin
 *  3. Vendor is verified/approved by admin
 */
const checkVendorApproved = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.userId },
    });

    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: "No vendor profile found. Register as VENDOR first.",
      });
    }

    if (vendor.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your vendor account has been blocked by the admin. Contact support.",
      });
    }

    if (!vendor.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Your vendor account is pending admin approval. You cannot access this feature yet.",
      });
    }

    // Attach vendor info for downstream use
    req.vendor = vendor;
    next();
  } catch (error) {
    console.error("[VendorApproval Middleware Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = checkVendorApproved;
