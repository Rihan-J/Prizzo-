/**
 * ─── Redis Configuration (ioredis TCP) ───
 *
 * Single ioredis client used across:
 *  - Cache layer (get/set/del/scan)
 *  - Rate limiting (via rate-limit-redis sendCommand)
 *  - Socket.IO Redis adapter (pub/sub)
 *  - BullMQ job queues
 *
 * Features:
 *  - Automatic reconnect with exponential backoff
 *  - Health check (PING)
 *  - Graceful shutdown
 *  - TLS support (Upstash requires rediss://)
 *  - Fallback logic for quota exceeded/connection failure
 */

const Redis = require("ioredis");
const config = require("./env");
const logger = require("../utils/logger");

// Environment toggle for Redis
const USE_REDIS = process.env.USE_REDIS !== "false" && !!config.redis.url;

if (!USE_REDIS) {
  logger.warn("REDIS is disabled via USE_REDIS=false or missing REDIS_URL.");
}

/**
 * Create an ioredis client with retry logic
 * @param {string} name - Client identifier for logging
 * @param {boolean} lazyConnect - Whether to defer connection
 * @returns {import('ioredis').Redis|null}
 */
function createRedisClient(name = "default", lazyConnect = false) {
  if (!USE_REDIS) return null;

  try {
    const client = new Redis(config.redis.url, {
      maxRetriesPerRequest: null, // Required for BullMQ compatibility
      enableReadyCheck: true,
      connectTimeout: 10000,
      retryStrategy(times) {
        // Stop retrying if we hit too many failures to avoid spamming logs
        if (times > 20) {
          logger.error({ client: name }, "Redis: Maximum reconnection attempts reached. Continuing without Redis.");
          return null;
        }
        const delay = Math.min(times * 200, 5000);
        logger.warn({ client: name, attempt: times, nextRetryMs: delay }, "Redis reconnecting...");
        return delay;
      },
      reconnectOnError(err) {
        const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT", "max requests limit exceeded"];
        const shouldReconnect = targetErrors.some((e) => err.message.includes(e));
        
        if (err.message.includes("max requests limit exceeded")) {
          logger.error({ client: name, error: err.message }, "Upstash Redis Quota Exceeded. Redis features will be degraded.");
          return false; // Don't reconnect immediately on quota error
        }
        
        return shouldReconnect;
      },
      tls: config.redis.url.startsWith("rediss://") ? {} : undefined,
      lazyConnect,
    });

    client.on("connect", () => {
      logger.info({ client: name }, "Redis connected");
    });

    client.on("ready", () => {
      logger.info({ client: name }, "Redis ready");
    });

    client.on("error", (err) => {
      if (err.message.includes("max requests limit exceeded")) {
        logger.error({ client: name, err: "Quota Exceeded" }, "Redis Quota Limit Reached");
      } else {
        logger.error({ client: name, err: err.message }, "Redis error");
      }
    });

    client.on("close", () => {
      logger.info({ client: name }, "Redis connection closed");
    });

    return client;
  } catch (error) {
    logger.error({ client: name, err: error.message }, "Failed to initialize Redis client");
    return null;
  }
}

// ── Primary client (cache, rate limiting, general commands) ──
const redisClient = createRedisClient("primary", false);

// ── Pub client for Socket.IO adapter ──
const redisPubClient = createRedisClient("socket-pub", false);

// ── Sub client for Socket.IO adapter ──
const redisSubClient = createRedisClient("socket-sub", false);

/**
 * Wait for all Redis clients to be ready
 * Returns true if successful, false if Redis is unavailable
 */
async function waitForRedis() {
  if (!USE_REDIS || !redisClient) {
    return false;
  }

  // Wait for all clients to reach "ready" state
  const waitReady = (client, name) =>
    new Promise((resolve) => {
      if (!client || client.status === "ready") return resolve(true);
      
      const onReady = () => {
        cleanup();
        resolve(true);
      };

      const onError = (err) => {
        logger.error({ client: name, err: err.message }, "Redis client failed during startup");
        cleanup();
        resolve(false);
      };

      const timeout = setTimeout(() => {
        logger.warn({ client: name }, "Redis connection timed out during startup");
        cleanup();
        resolve(false);
      }, 5000); // Shorter timeout for faster startup fallback

      const cleanup = () => {
        client.removeListener("ready", onReady);
        client.removeListener("error", onError);
        clearTimeout(timeout);
      };

      client.once("ready", onReady);
      client.once("error", onError);
    });

  try {
    const results = await Promise.all([
      waitReady(redisClient, "primary"),
      waitReady(redisPubClient, "socket-pub"),
      waitReady(redisSubClient, "socket-sub"),
    ]);
    
    const allReady = results.every(res => res === true);
    if (allReady) {
      logger.info("✅ All Redis clients ready.");
    } else {
      logger.warn("⚠️ Some Redis clients failed to initialize. Proceeding with degraded mode.");
    }
    return allReady;
  } catch (err) {
    logger.error({ err: err.message }, "❌ Redis connection critical failure");
    return false;
  }
}

/**
 * Health check — sends PING to primary client
 * @returns {Promise<boolean>}
 */
async function redisHealthCheck() {
  if (!redisClient || redisClient.status !== "ready") return false;
  try {
    const result = await redisClient.ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

/**
 * Gracefully disconnect all Redis clients
 */
async function disconnectRedis() {
  const clients = [redisClient, redisPubClient, redisSubClient].filter(Boolean);
  await Promise.allSettled(clients.map((c) => c.quit()));
  logger.info("Redis clients disconnected.");
}

module.exports = {
  USE_REDIS,
  redisClient,
  redisPubClient,
  redisSubClient,
  waitForRedis,
  redisHealthCheck,
  disconnectRedis,
};

