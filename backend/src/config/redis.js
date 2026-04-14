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
 */

const Redis = require("ioredis");
const config = require("./env");
const logger = require("../utils/logger");

if (!config.redis.url) {
  logger.warn("REDIS_URL not set — Redis features will be disabled.");
}

/**
 * Create an ioredis client with retry logic
 * @param {string} name - Client identifier for logging
 * @param {boolean} lazyConnect - Whether to defer connection
 * @returns {import('ioredis').Redis|null}
 */
function createRedisClient(name = "default", lazyConnect = false) {
  if (!config.redis.url) return null;

  const client = new Redis(config.redis.url, {
    maxRetriesPerRequest: null, // Required for BullMQ compatibility
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      logger.warn({ client: name, attempt: times, nextRetryMs: delay }, "Redis reconnecting...");
      return delay;
    },
    reconnectOnError(err) {
      const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
      return targetErrors.some((e) => err.message.includes(e));
    },
    tls: {},
    lazyConnect,
  });

  client.on("connect", () => {
    logger.info({ client: name }, "Redis connected");
  });

  client.on("ready", () => {
    logger.info({ client: name }, "Redis ready");
  });

  client.on("error", (err) => {
    logger.error({ client: name, err: err.message }, "Redis error");
  });

  client.on("close", () => {
    logger.info({ client: name }, "Redis connection closed");
  });

  return client;
}

// ── Primary client (cache, rate limiting, general commands) ── eager connect
const redisClient = createRedisClient("primary", false);

// ── Pub client for Socket.IO adapter ── eager connect (adapter subscribes immediately)
const redisPubClient = createRedisClient("socket-pub", false);

// ── Sub client for Socket.IO adapter ── eager connect
const redisSubClient = createRedisClient("socket-sub", false);

/**
 * Wait for all Redis clients to be ready
 */
async function waitForRedis() {
  if (!redisClient) {
    logger.warn("Redis disabled — no REDIS_URL configured.");
    return;
  }

  // Wait for all clients to reach "ready" state
  const waitReady = (client, name) =>
    new Promise((resolve, reject) => {
      if (client.status === "ready") return resolve();
      client.once("ready", resolve);
      client.once("error", (err) => {
        logger.error({ client: name, err: err.message }, "Redis client failed to connect");
        reject(err);
      });
      // Timeout after 15 seconds
      setTimeout(() => reject(new Error(`Redis ${name} connection timeout`)), 15000);
    });

  try {
    await Promise.all([
      waitReady(redisClient, "primary"),
      waitReady(redisPubClient, "socket-pub"),
      waitReady(redisSubClient, "socket-sub"),
    ]);
    logger.info("✅ All Redis clients ready.");
  } catch (err) {
    logger.error({ err }, "❌ Redis connection failed");
    throw err;
  }
}

/**
 * Health check — sends PING to primary client
 * @returns {Promise<boolean>}
 */
async function redisHealthCheck() {
  if (!redisClient) return false;
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
  redisClient,
  redisPubClient,
  redisSubClient,
  waitForRedis,
  redisHealthCheck,
  disconnectRedis,
};
