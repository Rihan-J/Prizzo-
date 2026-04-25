const prisma = require("../config/db");
const cache = require("../utils/cache");
const logger = require("../utils/logger");
const { sendSuccess, sendError, paginationMeta } = require("../utils/response");
const { getNearbyRecommendationSummary } = require("../services/ai.service");
const { searchNearbyProducts, sortResults } = require("../services/nearby.service");

const ALLOWED_RADII_KM = new Set([1, 2, 3, 5]);
const ALLOWED_NEARBY_SORTS = new Set(["best", "cheapest", "nearest"]);
const MAX_NEARBY_LIMIT = 50;

function parseNearbyQuery(reqQuery) {
  const lat = parseFloat(reqQuery.lat);
  const lng = parseFloat(reqQuery.lng);
  const requestedRadius = parseFloat(reqQuery.radius || "3");
  const radius = ALLOWED_RADII_KM.has(requestedRadius) ? requestedRadius : 3;
  const query = typeof reqQuery.query === "string" ? reqQuery.query.trim() : "";
  const sort = ALLOWED_NEARBY_SORTS.has(reqQuery.sort) ? reqQuery.sort : "best";
  const page = Math.max(1, parseInt(reqQuery.page, 10) || 1);
  const limit = Math.min(MAX_NEARBY_LIMIT, Math.max(1, parseInt(reqQuery.limit, 10) || 20));

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { error: "lat must be a valid number between -90 and 90." };
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { error: "lng must be a valid number between -180 and 180." };
  }
  if (!query || query.length < 2) {
    return { error: "query must be at least 2 characters." };
  }

  return { lat, lng, radius, query, sort, page, limit };
}

const getNearbyProducts = async (req, res) => {
  try {
    const parsed = parseNearbyQuery(req.query);
    if (parsed.error) return sendError(res, 400, parsed.error);

    const { lat, lng, radius, query, sort, page, limit } = parsed;
    const skip = (page - 1) * limit;

    // ── Delegate to shared service ──
    const { scored, cheapest, nearest, best } = await searchNearbyProducts({ lat, lng, radius, query });
    const sorted = sortResults(scored, sort);

    const summary = await getNearbyRecommendationSummary({
      query,
      radius,
      lat,
      lng,
      results: sorted,
      cheapest,
      nearest,
      best,
    });

    return sendSuccess(res, 200, {
      results: sorted.slice(skip, skip + limit),
      recommendation: {
        cheapestProductId: cheapest?.productId || null,
        nearestProductId: nearest?.productId || null,
        bestProductId: best?.productId || null,
        summary,
      },
    }, paginationMeta(page, limit, sorted.length));
  } catch (error) {
    logger.error({ err: error }, "[GetNearbyProducts Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── GET /products — List All Products (with search & filter + server cache) ───
const getAllProducts = async (req, res) => {
  try {
    const { query, category, storeId, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // ── Server-side cache ──
    const cacheKey = `products:${JSON.stringify({ query, category, storeId, page: pageNum, limit: limitNum })}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return sendSuccess(res, 200, cached.data, cached.meta);
    }

    // ── Build dynamic where clause ──
    const where = { isAvailable: true };

    if (storeId && typeof storeId === "string" && storeId.trim().length > 0) {
      where.storeId = storeId.trim();
    }

    if (query && typeof query === "string" && query.trim().length > 0) {
      where.OR = [
        { name: { contains: query.trim(), mode: "insensitive" } },
        { description: { contains: query.trim(), mode: "insensitive" } },
      ];
    }

    if (category && typeof category === "string" && category.trim().length > 0) {
      where.category = { equals: category.trim(), mode: "insensitive" };
    }

    // ── Fetch products — select only needed fields for list view ──
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          price: true,
          basePrice: true,
          profitMargin: true,
          category: true,
          stock: true,
          isAvailable: true,
          createdAt: true,
          storeId: true,
          store: {
            select: {
              id: true,
              name: true,
              address: true,
              latitude: true,
              longitude: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    const meta = paginationMeta(pageNum, limitNum, total);
    const responseData = { data: { products }, meta };
    await cache.set(cacheKey, responseData, 30);

    return sendSuccess(res, 200, { products }, meta);
  } catch (error) {
    logger.error({ err: error }, "[GetAllProducts Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── GET /products/:id — Get Single Product (full detail) ───
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Cache individual product
    const cacheKey = `product:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return sendSuccess(res, 200, cached);

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!product) {
      return sendError(res, 404, "Product not found.");
    }

    await cache.set(cacheKey, { product }, 30);
    return sendSuccess(res, 200, { product });
  } catch (error) {
    logger.error({ err: error }, "[GetProductById Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── GET /products/categories — List All Categories (cached 60s) ───
const getCategories = async (req, res) => {
  try {
    const cacheKey = "categories:all";
    const cached = await cache.get(cacheKey);
    if (cached) return sendSuccess(res, 200, cached);

    const categories = await prisma.product.findMany({
      where: { isAvailable: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    const result = { categories: categories.map((c) => c.category) };
    await cache.set(cacheKey, result, 60);
    return sendSuccess(res, 200, result);
  } catch (error) {
    logger.error({ err: error }, "[GetCategories Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

module.exports = { getAllProducts, getNearbyProducts, getProductById, getCategories };
