require("dotenv").config();

const express = require("express");
const cors = require("cors");
const config = require("./config/env");
const prisma = require("./config/db");

// ─── Import Routes ───
const authRoutes = require("./routes/auth.routes");
const vendorRoutes = require("./routes/vendor.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const storeRoutes = require("./routes/store.routes");
const adminRoutes = require("./routes/admin.routes");

// ─── Initialize Express ───
const app = express();

// ─── Global Middleware ───
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ───
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Prizzo API is running.",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───
app.use("/auth", authRoutes);
app.use("/vendor", vendorRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/stores", storeRoutes);
app.use("/admin", adminRoutes);

// ─── 404 Handler ───
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  console.error("[Server Error]", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

// ─── Start Server ───
const PORT = config.port;

async function main() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully.");

    app.listen(PORT, () => {
      console.log(`\n🚀 Prizzo Backend Server running on http://localhost:${PORT}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Auth API:    http://localhost:${PORT}/auth\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

main();

// ─── Graceful Shutdown ───
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
