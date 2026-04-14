/**
 * ─── Rate Limiting Middleware (Redis-Backed) ───
 *
 * Three tiers backed by Redis via rate-limit-redis:
 * 1. Auth limiter   — 30 req / 15 min per IP (login/register)
 * 2. General limiter — 200 req / 1 min per IP (API abuse protection)
 * 3. Admin limiter  — 60 req / 1 min per IP (admin panel)
 *
 * All counters stored in Redis so they are shared across
 * PM2 cluster workers. Falls back to in-memory if Redis unavailable.
 */

const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redisClient } = require("../config/redis");
const { sendError } = require("../utils/response");

/**
 * Build a Redis store if the client is available
 * @param {string} prefix - unique key prefix for this limiter
 * @returns {RedisStore|undefined}
 */
function buildStore(prefix) {
  if (!redisClient) return undefined; // Falls back to express-rate-limit's default MemoryStore

  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: `prizzo:rl:${prefix}:`,
  });
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
