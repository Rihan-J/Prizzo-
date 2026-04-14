/**
 * ─── Structured Logger (Pino) ───
 * 
 * Production: JSON logs (machine-parseable)
 * Development: Pretty-printed colored output
 * 
 * Features:
 * - Request ID tracking via child loggers
 * - Structured error logs with stack traces
 * - Log levels: trace, debug, info, warn, error, fatal
 * 
 * Future-ready: Compatible with log aggregation (ELK, Datadog, etc.)
 */

const pino = require("pino");

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  
  // Add timestamp in ISO format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Base fields included in every log
  base: {
    service: "prizzo-backend",
    env: process.env.NODE_ENV || "development",
  },

  // Redact sensitive fields from logs
  redact: {
    paths: ["req.headers.authorization", "password", "token"],
    censor: "[REDACTED]",
  },

  // Serializers for consistent object formatting
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      requestId: req.id,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },

  // Pretty print in development
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname,service,env",
          },
        },
      }),
});

/**
 * Create a child logger with a request ID for tracing
 * Usage: const reqLogger = logger.child({ requestId: req.id });
 */
logger.createRequestLogger = (requestId) => {
  return logger.child({ requestId });
};

module.exports = logger;
