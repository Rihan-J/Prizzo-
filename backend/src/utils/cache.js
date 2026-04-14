/**
 * ─── Redis-Backed Cache with TTL ───
 *
 * Drop-in replacement for the in-memory ServerCache.
 * Same interface (get, set, invalidate, clear, stats, destroy)
 * so controllers require zero changes.
 *
 * Backed by ioredis TCP client. Falls back to in-memory if Redis
 * is not available (graceful degradation).
 *
 * Cache Invalidation Rules:
 * - Product CRUD        → invalidate("products")
 * - Stock updates       → invalidate("products") + invalidate("stores")
 * - Order creation      → invalidate("products") + invalidate("stores")
 * - Vendor store CRUD   → invalidate("stores")
 * - Category changes    → invalidate("categories")
 * - Admin analytics     → invalidate("admin")
 *
 * All keys are prefixed with "prizzo:" for namespace isolation.
 */

const logger = require("./logger");

const CACHE_PREFIX = "prizzo:cache:";

class RedisCache {
  constructor() {
    this._client = null;
    this.hits = 0;
    this.misses = 0;

    // Fallback in-memory store in case Redis is unavailable
    /** @type {Map<string, { data: any, expiresAt: number }>} */
    this._fallback = new Map();
    this._cleanupInterval = setInterval(() => this._cleanupFallback(), 60_000);
  }

  /**
   * Attach the Redis client (called during boot)
   * @param {import('ioredis').Redis|null} client
   */
  setClient(client) {
    this._client = client;
    if (client) {
      logger.info("Cache layer attached to Redis");
    } else {
      logger.warn("Cache layer running in fallback (in-memory) mode");
    }
  }

  /**
   * Get cached data by key
   * @param {string} key
   * @returns {Promise<any|null>} Cached data or null if expired/missing
   */
  async get(key) {
    const prefixedKey = CACHE_PREFIX + key;

    // ── Redis path ──
    if (this._client) {
      try {
        const raw = await this._client.get(prefixedKey);
        if (raw === null) {
          this.misses++;
          return null;
        }
        this.hits++;
        logger.debug({ key, hits: this.hits, misses: this.misses }, "Cache HIT");
        return JSON.parse(raw);
      } catch (err) {
        logger.error({ key, err: err.message }, "Cache GET error — falling back");
        this.misses++;
        return null;
      }
    }

    // ── Fallback path ──
    const entry = this._fallback.get(key);
    if (!entry) { this.misses++; return null; }
    if (Date.now() > entry.expiresAt) { this._fallback.delete(key); this.misses++; return null; }
    this.hits++;
    return entry.data;
  }

  /**
   * Store data with TTL
   * @param {string} key
   * @param {any} data
   * @param {number} ttlSeconds - Time-to-live in seconds (default 30)
   */
  async set(key, data, ttlSeconds = 30) {
    const prefixedKey = CACHE_PREFIX + key;

    if (this._client) {
      try {
        await this._client.set(prefixedKey, JSON.stringify(data), "EX", ttlSeconds);
        logger.debug({ key, ttlSeconds }, "Cache SET");
        return;
      } catch (err) {
        logger.error({ key, err: err.message }, "Cache SET error — falling back");
      }
    }

    // Fallback
    this._fallback.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  /**
   * Invalidate all keys matching a pattern
   * @param {string} pattern - Substring to match against keys
   */
  async invalidate(pattern) {
    if (this._client) {
      try {
        const searchPattern = CACHE_PREFIX + "*" + pattern + "*";
        let cursor = "0";
        let totalDeleted = 0;

        do {
          const [nextCursor, keys] = await this._client.scan(cursor, "MATCH", searchPattern, "COUNT", 100);
          cursor = nextCursor;
          if (keys.length > 0) {
            await this._client.del(...keys);
            totalDeleted += keys.length;
          }
        } while (cursor !== "0");

        if (totalDeleted > 0) {
          logger.info({ pattern, invalidatedCount: totalDeleted }, "Cache INVALIDATED");
        }
        return;
      } catch (err) {
        logger.error({ pattern, err: err.message }, "Cache INVALIDATE error");
      }
    }

    // Fallback
    let count = 0;
    for (const key of this._fallback.keys()) {
      if (key.includes(pattern)) { this._fallback.delete(key); count++; }
    }
    if (count > 0) {
      logger.info({ pattern, invalidatedCount: count }, "Cache INVALIDATED (fallback)");
    }
  }

  /**
   * Clear the entire cache namespace
   */
  async clear() {
    if (this._client) {
      try {
        let cursor = "0";
        let totalCleared = 0;
        do {
          const [nextCursor, keys] = await this._client.scan(cursor, "MATCH", CACHE_PREFIX + "*", "COUNT", 100);
          cursor = nextCursor;
          if (keys.length > 0) {
            await this._client.del(...keys);
            totalCleared += keys.length;
          }
        } while (cursor !== "0");
        logger.info({ clearedEntries: totalCleared }, "Cache CLEARED");
        return;
      } catch (err) {
        logger.error({ err: err.message }, "Cache CLEAR error");
      }
    }

    const size = this._fallback.size;
    this._fallback.clear();
    logger.info({ clearedEntries: size }, "Cache CLEARED (fallback)");
  }

  /**
   * Get cache statistics
   */
  stats() {
    return {
      backend: this._client ? "redis" : "in-memory",
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(1) + "%"
        : "N/A",
    };
  }

  /**
   * Cleanup expired fallback entries
   * @private
   */
  _cleanupFallback() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this._fallback) {
      if (now > entry.expiresAt) { this._fallback.delete(key); cleaned++; }
    }
    if (cleaned > 0) {
      logger.debug({ cleaned }, "Fallback cache cleanup");
    }
  }

  /**
   * Shutdown — clear intervals
   */
  destroy() {
    clearInterval(this._cleanupInterval);
    this._fallback.clear();
  }
}

module.exports = new RedisCache();
