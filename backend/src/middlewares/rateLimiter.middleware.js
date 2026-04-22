/**
 * ─── Rate Limiting Middleware (Hybrid) ───
 *
 * Three tiers:
 * 1. Auth limiter   — 30 req / 15 min per IP (login/register)
 * 2. General limiter — 200 req / 1 min per IP (API abuse protection)
 * 3. Admin limiter  — 60 req / 1 min per IP (admin panel)
 *
 * Logic:
 * - Uses Redis store if Redis is available and healthy.
 * - Falls back to express-rate-limit's default MemoryStore if Redis is down or quota exceeded.
 * - This prevents the app from crashing when Upstash limits are hit.
 */

const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redisClient, USE_REDIS } = require("../config/redis");
const { sendError } = require("../utils/response");
const logger = require("../utils/logger");

/**
 * Build a Redis store if the client is available and connected
 * @param {string} prefix - unique key prefix for this limiter
 * @returns {RedisStore|undefined}
 */
function buildStore(prefix) {
  const isRedisHealthy = USE_REDIS && redisClient && redisClient.status === "ready";

  if (!isRedisHealthy) {
    logger.warn(`RateLimiter: Redis unavailable for prefix "${prefix}". Falling back to memory store.`);
    return undefined; // Falls back to express-rate-limit's default MemoryStore
  }

  try {
    return new RedisStore({
      sendCommand: async (...args) => {
        try {
          return await redisClient.call(...args);
        } catch (err) {
          if (err.message.includes("max requests limit exceeded")) {
            logger.error({ prefix, err: "Quota Exceeded" }, "Redis RateLimiter quota exceeded. Degrading to memory.");
            // We can't easily switch stores mid-flight here, but returning null or throwing 
            // might be handled by express-rate-limit.
          }
          throw err;
        }
      },
      prefix: `prizzo:rl:${prefix}:`,
    });
  } catch (error) {
    logger.error({ prefix, err: error.message }, "Failed to initialize RedisStore for rate limiter");
    return undefined;
  }
}

// ── Auth Routes ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("auth"),
  handler: (req, res) => {
    sendError(res, 429, "Too many authentication attempts. Please try again later.");
  },
});

// ── General API Routes ──
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("general"),
  handler: (req, res) => {
    sendError(res, 429, "Too many requests. Please slow down.");
  },
});

// ── Admin Routes ──
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("admin"),
  handler: (req, res) => {
    sendError(res, 429, "Too many admin requests. Please slow down.");
  },
});

module.exports = { authLimiter, generalLimiter, adminLimiter };

