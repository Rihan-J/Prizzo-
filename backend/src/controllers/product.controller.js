const prisma = require("../config/db");

// ─── GET /products — List All Products (with search & filter) ───
const getAllProducts = async (req, res) => {
  try {
    const { query, category, storeId, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

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
      where.category = category.trim().toLowerCase();
    }

    // ── Fetch products with store info ──
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      products,
    });
  } catch (error) {
    console.error("[GetAllProducts Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /products/:id — Get Single Product ───
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("[GetProductById Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /products/categories — List All Categories ───
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.product.findMany({
      where: { isAvailable: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    return res.status(200).json({
      success: true,
      categories: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error("[GetCategories Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = { getAllProducts, getProductById, getCategories };
