/**
 * ─── Socket.IO Server (Redis-Scaled) ───
 *
 * Scoped to ORDER events ONLY:
 * - order:new         → notifies vendor when a new order is placed
 * - order:status-update → notifies user when order status changes
 *
 * Security:
 * - JWT authentication on connection (rejects unauthorized)
 * - Room-based isolation (user:{userId}, vendor:{storeId})
 * - No global broadcasts — emit only to targeted rooms
 *
 * Scaling:
 * - @socket.io/redis-adapter for multi-process pub/sub
 * - Stateless throttle via Redis (no in-memory Maps)
 */

const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { verifyToken } = require("../services/jwt.service");
const { redisClient, redisPubClient, redisSubClient } = require("./redis");
const logger = require("../utils/logger");

const THROTTLE_MS = 2000;
const THROTTLE_PREFIX = "prizzo:throttle:";

/**
 * Initialize Socket.IO on the HTTP server
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production"
        ? [process.env.CORS_ORIGIN || "https://prizzo.vercel.app"]
        : ["http://localhost:5173"],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // ── Attach Redis Adapter for horizontal scaling ──
  if (redisPubClient && redisSubClient) {
    io.adapter(createAdapter(redisPubClient, redisSubClient));
    logger.info("Socket.IO Redis adapter attached");
  } else {
    logger.warn("Socket.IO running WITHOUT Redis adapter — single-process only");
  }

  // ── JWT Authentication Middleware ──
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      logger.warn("Socket connection rejected: no token provided");
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = verifyToken(token);
      socket.user = decoded; // { userId, role }
      next();
    } catch (err) {
      logger.warn({ err: err.message }, "Socket connection rejected: invalid token");
      next(new Error("Invalid or expired token"));
    }
  });

  // ── Connection Handler ──
  io.on("connection", (socket) => {
    const { userId, role } = socket.user;
    logger.info({ userId, role, socketId: socket.id }, "Socket connected");

    // Every user joins their personal room
    socket.join(`user:${userId}`);

    // Vendors can join their store room
    if (role === "VENDOR") {
      socket.on("join-store", (storeId) => {
        if (storeId && typeof storeId === "string") {
          socket.join(`vendor:${storeId}`);
          logger.info({ userId, storeId }, "Vendor joined store room");
        }
      });
    }

    socket.on("disconnect", (reason) => {
      logger.info({ userId, reason }, "Socket disconnected");
    });

    socket.on("error", (err) => {
      logger.error({ userId, err: err.message }, "Socket error");
    });
  });

  return io;
}

/**
 * Throttled emit — prevents event spam for the same order.
 * Uses Redis SET NX EX for stateless, cluster-safe throttling.
 *
 * @param {import('socket.io').Server} io
 * @param {string} room - Target room (e.g., "vendor:{storeId}" or "user:{userId}")
 * @param {string} event - Event name
 * @param {object} data - Event payload (must contain orderId)
 */
async function throttledEmit(io, room, event, data) {
  const throttleKey = `${THROTTLE_PREFIX}${room}:${event}:${data.orderId || "unknown"}`;

  // ── Redis-based throttle ──
  if (redisClient) {
    try {
      // SET NX EX: only sets the key if it doesn't already exist, expires in THROTTLE_MS
      const ttlSec = Math.max(1, Math.ceil(THROTTLE_MS / 1000));
      const result = await redisClient.set(throttleKey, "1", "EX", ttlSec, "NX");

      if (result === null) {
        // Key already exists — throttled
        logger.debug({ throttleKey }, "Socket emit throttled");
        return;
      }
    } catch (err) {
      // On Redis errors, allow the emit to proceed (fail-open)
      logger.error({ err: err.message }, "Throttle check failed — allowing emit");
    }
  }

  // Emit to the targeted room only
  io.to(room).emit(event, data);
  logger.info({ room, event, orderId: data.orderId }, "Socket event emitted");
}

module.exports = { initSocket, throttledEmit };
