require("dotenv").config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  queue: {
    enabled: process.env.QUEUE_ENABLED === "true",
  },
};
