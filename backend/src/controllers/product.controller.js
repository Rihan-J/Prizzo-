const prisma = require("../config/db");
const cache = require("../utils/cache");
const logger = require("../utils/logger");
const { sendSuccess, sendError, paginationMeta } = require("../utils/response");

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

module.exports = { getAllProducts, getProductById, getCategories };
