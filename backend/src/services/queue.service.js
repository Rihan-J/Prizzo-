/**
 * ─── BullMQ Job Queue Service ───
 *
 * Queues:
 *  1. notification — order notifications (new order, status change)
 *  2. analytics   — heavy admin calculations (dashboard stats, vendor perf)
 *
 * Features:
 *  - QUEUE_ENABLED flag — workers only start when enabled
 *  - Exponential backoff on failed jobs
 *  - Graceful shutdown (drain + close)
 *  - Prevents unnecessary polling when disabled
 *
 * Uses ioredis via BullMQ's native connection config.
 */

const { Queue, Worker } = require("bullmq");
const config = require("../config/env");
const logger = require("../utils/logger");

// ── Connection config ── (BullMQ creates its own ioredis instances)
const connectionConfig = config.redis.url
  ? {
      connection: {
        url: config.redis.url,
        maxRetriesPerRequest: null,
        tls: {},
      },
    }
  : null;

// ── Queues (always created — used for enqueuing even if workers are off) ──
let notificationQueue = null;
let analyticsQueue = null;

// ── Workers (only created when QUEUE_ENABLED) ──
let notificationWorker = null;
let analyticsWorker = null;

/**
 * Initialize queues and optionally start workers
 */
function initQueues() {
  if (!connectionConfig) {
    logger.warn("BullMQ disabled — no REDIS_URL configured.");
    return;
  }

  // ── Create Queues ──
  notificationQueue = new Queue("notification", {
    ...connectionConfig,
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    },
  });

  analyticsQueue = new Queue("analytics", {
    ...connectionConfig,
    defaultJobOptions: {
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 20 },
      attempts: 2,
      backoff: { type: "exponential", delay: 5000 },
    },
  });

  logger.info("BullMQ queues created (notification, analytics)");

  // ── Start Workers only if enabled ──
  if (config.queue.enabled) {
    startWorkers();
  } else {
    logger.info("BullMQ workers NOT started (QUEUE_ENABLED=false)");
  }
}

/**
 * Start BullMQ workers
 */
function startWorkers() {
  // ── Notification Worker ──
  notificationWorker = new Worker(
    "notification",
    async (job) => {
      const { type, data } = job.data;
      logger.info({ jobId: job.id, type, orderId: data?.orderId }, "Processing notification job");

      switch (type) {
        case "order-created": {
          // In production, this would send push notifications, emails, SMS, etc.
          logger.info({
            orderId: data.orderId,
            storeId: data.storeId,
            userId: data.userId,
            total: data.totalAmount,
          }, "📦 Order notification processed — new order placed");
          break;
        }
        case "order-status-changed": {
          logger.info({
            orderId: data.orderId,
            oldStatus: data.oldStatus,
            newStatus: data.newStatus,
          }, "🔄 Order notification processed — status updated");
          break;
        }
        default:
          logger.warn({ type }, "Unknown notification job type");
      }
    },
    {
      ...connectionConfig,
      concurrency: 5,
      limiter: { max: 10, duration: 1000 }, // Max 10 jobs/sec
    }
  );

  notificationWorker.on("completed", (job) => {
    logger.debug({ jobId: job.id }, "Notification job completed");
  });

  notificationWorker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, "Notification job failed");
  });

  // ── Analytics Worker ──
  analyticsWorker = new Worker(
    "analytics",
    async (job) => {
      const { type } = job.data;
      logger.info({ jobId: job.id, type }, "Processing analytics job");

      switch (type) {
        case "refresh-dashboard": {
          // Heavy aggregation would happen here
          logger.info("📊 Dashboard analytics recalculated");
          break;
        }
        case "refresh-vendor-performance": {
          logger.info("📈 Vendor performance analytics recalculated");
          break;
        }
        default:
          logger.warn({ type }, "Unknown analytics job type");
      }
    },
    {
      ...connectionConfig,
      concurrency: 2,
      limiter: { max: 2, duration: 5000 }, // Max 2 jobs per 5 seconds
    }
  );

  analyticsWorker.on("completed", (job) => {
    logger.debug({ jobId: job.id }, "Analytics job completed");
  });

  analyticsWorker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, "Analytics job failed");
  });

  logger.info("✅ BullMQ workers started (notification, analytics)");
}

/**
 * Enqueue a notification job
 * @param {string} type - Job type (e.g., "order-created", "order-status-changed")
 * @param {object} data - Job payload
 */
async function enqueueNotification(type, data) {
  if (!notificationQueue) {
    logger.debug({ type }, "Notification queue not available — skipping");
    return;
  }

  try {
    await notificationQueue.add(type, { type, data }, { priority: 1 });
    logger.debug({ type, orderId: data?.orderId }, "Notification job enqueued");
  } catch (err) {
    logger.error({ type, err: err.message }, "Failed to enqueue notification");
  }
}

/**
 * Enqueue an analytics job
 * @param {string} type - Job type (e.g., "refresh-dashboard", "refresh-vendor-performance")
 * @param {object} data - Job payload
 */
async function enqueueAnalytics(type, data = {}) {
  if (!analyticsQueue) {
    logger.debug({ type }, "Analytics queue not available — skipping");
    return;
  }

  try {
    // Deduplicate: only one job for this type at a time
    await analyticsQueue.add(type, { type, data }, {
      jobId: `analytics:${type}`,
      priority: 2,
    });
    logger.debug({ type }, "Analytics job enqueued");
  } catch (err) {
    logger.error({ type, err: err.message }, "Failed to enqueue analytics");
  }
}

/**
 * Graceful shutdown — drain and close queues and workers
 */
async function shutdownQueues() {
  const closeables = [
    notificationWorker,
    analyticsWorker,
    notificationQueue,
    analyticsQueue,
  ].filter(Boolean);

  await Promise.allSettled(closeables.map((c) => c.close()));
  logger.info("BullMQ queues and workers shut down.");
}

module.exports = {
  initQueues,
  enqueueNotification,
  enqueueAnalytics,
  shutdownQueues,
};
