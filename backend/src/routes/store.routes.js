const express = require("express");
const prisma = require("../config/db");
const cache = require("../utils/cache");
const logger = require("../utils/logger");
const { sendSuccess, sendError } = require("../utils/response");
const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Cache store details for 60 seconds
    const cacheKey = `store:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return sendSuccess(res, 200, cached);

    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return sendError(res, 404, "Store not found.");
    }

    const result = { store };
    await cache.set(cacheKey, result, 60);
    return sendSuccess(res, 200, result);
  } catch (error) {
    logger.error({ err: error }, "[GetStoreById Error]");
    return sendError(res, 500, "Internal server error.");
  }
});

module.exports = router;
