require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");

const config = require("./config/env");
const prisma = require("./config/db");
const logger = require("./utils/logger");
const cache = require("./utils/cache");
const { redisClient, waitForRedis, redisHealthCheck, disconnectRedis } = require("./config/redis");
const { initSocket } = require("./config/socket");
const { initQueues, shutdownQueues } = require("./services/queue.service");
const requestLogger = require("./middlewares/requestLogger.middleware");
const { generalLimiter, authLimiter, adminLimiter } = require("./middlewares/rateLimiter.middleware");
const { sendError } = require("./utils/response");

// ─── Import Routes ───
const authRoutes = require("./routes/auth.routes");
const vendorRoutes = require("./routes/vendor.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const storeRoutes = require("./routes/store.routes");
const adminRoutes = require("./routes/admin.routes");
const aiRoutes = require("./routes/ai.routes");

// ─── Initialize Express ───
const app = express();

// ─── Security Headers ───
app.use(helmet());

// ─── CORS — Restricted Origins ───
const allowedOrigins = config.nodeEnv === "production"
  ? [
    process.env.CORS_ORIGIN,
    "https://prizzo-in.vercel.app",
    "https://prizzo.vercel.app",
    "https://prizzo-p7ju-hgzq69a7t-rihanj27pvt-4651s-projects.vercel.app",
    "https://prizzo-chi.vercel.app",
    "https://prizzo-india.vercel.app"
  ].filter(Boolean)
  : ["http://localhost:5173"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ─── Compression (gzip) ───
app.use(compression());

// ─── Body Parsers ───
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Request Logger (ID tracking + duration monitoring) ───

// ─── Global Rate Limiter (REMOVED as per requirements) ───
// app.use(generalLimiter); 

// ─── Health Check (includes Redis + DB status) ───
app.get("/", async (req, res) => {
  const redisOk = await redisHealthCheck();

  res.json({
    success: true,
    data: {
      message: "🚀 Prizzo API is running.",
      version: "3.1.0",
      timestamp: new Date().toISOString(),
      cache: cache.stats(),
      health: {
        redis: redisOk ? "connected" : "disconnected/quota-exceeded",
        database: "connected",
        queues: config.queue.enabled ? "enabled" : "disabled",
      },
    },
    error: null,
  });
});

// ─── Dedicated Health Endpoint ───
app.get("/health", async (req, res) => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch { /* db unreachable */ }

  const redisOk = await redisHealthCheck();
  // Server is considered "healthy" if DB is OK, even if Redis is down (it's optional now)
  const allOk = dbOk;

  res.status(allOk ? 200 : 503).json({
    success: allOk,
    data: {
      status: allOk ? (redisOk ? "healthy" : "degraded") : "error",
      database: dbOk ? "ok" : "error",
      redis: redisOk ? "ok" : "error",
      queues: config.queue.enabled ? "running" : "disabled",
      uptime: Math.floor(process.uptime()) + "s",
    },
    error: allOk ? null : "Database service is unavailable.",
  });
});

// ─── API Routes with Tier-Specific Rate Limiters ───
app.use("/auth", authLimiter, authRoutes); // Sensitive routes: /auth/login, /auth/register
app.use("/vendor", vendorRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/payment", paymentRoutes);
app.use("/stores", storeRoutes);
app.use("/admin", adminLimiter, adminRoutes);
app.use("/ai", aiRoutes);

// ─── 404 Handler ───
app.use((req, res) => {
  sendError(res, 404, `Route ${req.method} ${req.originalUrl} not found.`);
});

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  const log = req.log || logger;

  // CORS errors
  if (err.message === "Not allowed by CORS") {
    log.warn({ origin: req.headers.origin }, "CORS blocked");
    return sendError(res, 403, "Origin not allowed.");
  }

  // Log error with full stack trace
  log.error({
    err: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    method: req.method,
    url: req.originalUrl,
  }, "Unhandled server error");

  sendError(res, 500, "Internal server error.");
});

// ─── Create HTTP Server + Socket.IO ───
const server = http.createServer(app);
const io = initSocket(server);

// Make io accessible in controllers via req.app.get('io')
app.set("io", io);

// ─── Start Server ───
const PORT = config.port;

async function main() {
  try {
    // 1. Wait for Redis clients (safe fallback)
    const redisEnabled = await waitForRedis();

    if (redisEnabled) {
      // 2. Attach Redis client to cache layer only if available
      cache.setClient(redisClient);
      logger.info("✅ Redis features enabled.");
    } else {
      logger.warn("⚠️ Continuing without Redis features (Cache/Real-time/Distributed Rate Limiting).");
    }

    // 3. Connect Database
    await prisma.$connect();
    logger.info("✅ Database connected successfully.");

    // 4. Initialize BullMQ queues (workers start only if QUEUE_ENABLED and Redis available)
    if (redisEnabled || !config.queue.enabled) {
      initQueues();
    } else {
      logger.error("❌ Queues are enabled but Redis is unavailable. Jobs will not be processed.");
    }

    // 5. Start HTTP server
    server.listen(PORT, () => {
      logger.info({
        port: PORT,
        env: config.nodeEnv,
        cors: allowedOrigins,
        redis: redisEnabled ? "connected" : "disabled/fallback",
        queues: config.queue.enabled && redisEnabled ? "enabled" : "disabled",
      }, `🚀 Prizzo Backend v3.1 running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.fatal({ err: error.message }, "❌ Critical failure during startup");
    // We only exit if it's a non-recoverable error (like DB connection failure)
    if (error.message.includes("prisma")) {
      process.exit(1);
    }
  }
}

main();

// ─── Graceful Shutdown ───
const shutdown = async (signal) => {
  logger.info({ signal }, "Shutting down gracefully...");

  // 1. Stop accepting new connections
  server.close(() => {
    logger.info("HTTP server closed.");
  });

  try {
    // 2. Drain and close job queues
    await shutdownQueues();

    // 3. Destroy cache intervals
    cache.destroy();

    // 4. Disconnect Redis
    await disconnectRedis();

    // 5. Disconnect database
    await prisma.$disconnect();
  } catch (err) {
    logger.error({ err: err.message }, "Error during graceful shutdown");
  }

  logger.info("All connections closed. Exiting.");
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// IMPROVED: Handle unhandledRejection and uncaughtException without immediate exit if possible
process.on("uncaughtException", (err) => {
  logger.fatal({ err: err.message, stack: err.stack }, "Uncaught Exception DETECTED");
  // For safety, we still shutdown, but we log the full error first.
  // In a resilient system, we might decide to keep the process alive if the error is non-fatal.
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Rejection at Promise");
  // We don't necessarily need to crash the whole app for a rejected promise.
  // Just log it and monitor.
});


