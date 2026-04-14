const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  // ── Connection pool optimization for production ──
  // Neon pooler (already in DATABASE_URL) handles external pooling.
  // Prisma's internal pool is tuned for cluster mode.
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

module.exports = prisma;
