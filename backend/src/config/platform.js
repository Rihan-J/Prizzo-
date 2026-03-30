/**
 * ─── Platform Configuration ───
 * Global settings for the Prizzo platform.
 */

module.exports = {
  // Platform commission percentage on each order
  // e.g., 5 means 5% of totalAmount goes to the platform
  commissionPercentage: parseFloat(process.env.PLATFORM_COMMISSION || "5"),
};
