/**
 * ─── Request Logger Middleware ───
 * 
 * Features:
 * - Assigns a unique request ID to every request
 * - Logs request duration
 * - Flags slow requests (> 1000ms) as warnings
 * - Structured logging via Pino
 */

const crypto = require("crypto");
const logger = require("../utils/logger");

const requestLogger = (req, res, next) => {
  // Assign unique request ID
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);

  // Create a child logger with request context
  req.log = logger.child({ requestId: req.id });

  const start = Date.now();

  // Log when response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (duration > 1000) {
      req.log.warn(logData, "SLOW REQUEST");
    } else if (res.statusCode >= 400) {
      req.log.warn(logData, "Request completed with error");
    } else {
      req.log.info(logData, "Request completed");
    }
  });

  next();
};

module.exports = requestLogger;
