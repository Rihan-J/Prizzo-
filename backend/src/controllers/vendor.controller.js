const prisma = require("../config/db");
const cache = require("../utils/cache");
const logger = require("../utils/logger");
const { sendSuccess, sendError } = require("../utils/response");

// ─── POST /vendor/store — Create Store ───
const createStore = async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return sendError(res, 400, "Name, address, latitude, and longitude are required.");
    }
    if (typeof name !== "string" || name.trim().length < 2) {
      return sendError(res, 400, "Store name must be at least 2 characters.");
    }
    if (typeof address !== "string" || address.trim().length < 5) {
      return sendError(res, 400, "Address must be at least 5 characters.");
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return sendError(res, 400, "Latitude must be a number between -90 and 90.");
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return sendError(res, 400, "Longitude must be a number between -180 and 180.");
    }

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) return sendError(res, 403, "No vendor profile found. Register as VENDOR first.");

    const existingStore = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (existingStore) return sendError(res, 409, "You already have a store. Use PATCH to update it.");

    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        latitude: lat,
        longitude: lng,
        vendorId: vendor.id,
      },
    });

    await cache.invalidate("stores");
    logger.info({ storeId: store.id, vendorId: vendor.id }, "Store created");

    return sendSuccess(res, 201, { store });
  } catch (error) {
    logger.error({ err: error }, "[CreateStore Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── GET /vendor/store — Get Vendor's Store ───
const getVendorStore = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) return sendError(res, 403, "No vendor profile found.");

    const store = await prisma.store.findUnique({
      where: { vendorId: vendor.id },
      include: { _count: { select: { products: true } } },
    });

    if (!store) return sendError(res, 404, "No store found. Create one first.");

    return sendSuccess(res, 200, { store });
  } catch (error) {
    logger.error({ err: error }, "[GetVendorStore Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── PATCH /vendor/store — Update Store ───
const updateStore = async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) return sendError(res, 403, "No vendor profile found.");

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) return sendError(res, 404, "No store found. Create one first.");

    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) return sendError(res, 400, "Store name must be at least 2 characters.");
      updateData.name = name.trim();
    }
    if (address !== undefined) {
      if (typeof address !== "string" || address.trim().length < 5) return sendError(res, 400, "Address must be at least 5 characters.");
      updateData.address = address.trim();
    }
    if (latitude !== undefined) {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) return sendError(res, 400, "Latitude must be between -90 and 90.");
      updateData.latitude = lat;
    }
    if (longitude !== undefined) {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) return sendError(res, 400, "Longitude must be between -180 and 180.");
      updateData.longitude = lng;
    }

    if (Object.keys(updateData).length === 0) return sendError(res, 400, "No valid fields provided for update.");

    // If location changed, reset verification so admin must re-verify
    if (updateData.latitude !== undefined || updateData.longitude !== undefined || updateData.address !== undefined) {
      updateData.isLocationVerified = false;
    }

    const updated = await prisma.store.update({ where: { id: store.id }, data: updateData });

    await cache.invalidate("stores");
    logger.info({ storeId: store.id }, "Store updated");

    return sendSuccess(res, 200, { store: updated });
  } catch (error) {
    logger.error({ err: error }, "[UpdateStore Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── POST /vendor/products — Create Product ───
const createProduct = async (req, res) => {
  try {
    const { name, description, basePrice, profitMargin, category, stock } = req.body;

    if (!name || !description || basePrice === undefined || !category) {
      return sendError(res, 400, "Name, description, basePrice, and category are required.");
    }
    if (typeof name !== "string" || name.trim().length < 2) return sendError(res, 400, "Product name must be at least 2 characters.");
    if (typeof description !== "string" || description.trim().length < 5) return sendError(res, 400, "Description must be at least 5 characters.");

    const parsedBasePrice = parseFloat(basePrice);
    if (isNaN(parsedBasePrice) || parsedBasePrice <= 0) return sendError(res, 400, "Base price must be a positive number.");

    const parsedMargin = profitMargin !== undefined ? parseFloat(profitMargin) : 0;
    if (isNaN(parsedMargin) || parsedMargin < 0 || parsedMargin > 500) return sendError(res, 400, "Profit margin must be between 0 and 500%.");

    if (typeof category !== "string" || category.trim().length < 2) return sendError(res, 400, "Category must be at least 2 characters.");

    const parsedStock = stock !== undefined ? parseInt(stock, 10) : 0;
    if (isNaN(parsedStock) || parsedStock < 0) return sendError(res, 400, "Stock must be a non-negative integer.");

    const sellingPrice = Math.round((parsedBasePrice + (parsedBasePrice * parsedMargin / 100)) * 100) / 100;

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) return sendError(res, 403, "No vendor profile found.");

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) return sendError(res, 404, "Create a store before adding products.");

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        basePrice: parsedBasePrice,
        profitMargin: parsedMargin,
        price: sellingPrice,
        category: category.trim().toLowerCase(),
        stock: parsedStock,
        isAvailable: parsedStock > 0,
        storeId: store.id,
      },
    });

    // Invalidate product and category caches
    await Promise.all([
      cache.invalidate("products"),
      cache.invalidate("categories"),
    ]);
    logger.info({ productId: product.id, storeId: store.id }, "Product created");

    return sendSuccess(res, 201, { product });
  } catch (error) {
    logger.error({ err: error }, "[CreateProduct Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── GET /vendor/products — Get Vendor's Products (paginated) ───
const getVendorProducts = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) return sendError(res, 403, "No vendor profile found.");

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) return sendError(res, 404, "No store found.");

    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, 200, { products, count: products.length });
  } catch (error) {
    logger.error({ err: error }, "[GetVendorProducts Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── PATCH /vendor/products/:id — Update Product ───
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, profitMargin, category, stock, isAvailable } = req.body;

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) return sendError(res, 403, "No vendor profile found.");

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) return sendError(res, 404, "No store found.");

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) return sendError(res, 404, "Product not found.");
    if (existingProduct.storeId !== store.id) return sendError(res, 403, "You can only update your own products.");

    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) return sendError(res, 400, "Product name must be at least 2 characters.");
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      if (typeof description !== "string" || description.trim().length < 5) return sendError(res, 400, "Description must be at least 5 characters.");
      updateData.description = description.trim();
    }
    if (basePrice !== undefined) {
      const parsedBase = parseFloat(basePrice);
      if (isNaN(parsedBase) || parsedBase <= 0) return sendError(res, 400, "Base price must be a positive number.");
      updateData.basePrice = parsedBase;
    }
    if (profitMargin !== undefined) {
      const parsedMargin = parseFloat(profitMargin);
      if (isNaN(parsedMargin) || parsedMargin < 0 || parsedMargin > 500) return sendError(res, 400, "Profit margin must be between 0 and 500%.");
      updateData.profitMargin = parsedMargin;
    }
    if (updateData.basePrice !== undefined || updateData.profitMargin !== undefined) {
      const finalBase = updateData.basePrice ?? existingProduct.basePrice;
      const finalMargin = updateData.profitMargin ?? existingProduct.profitMargin;
      updateData.price = Math.round((finalBase + (finalBase * finalMargin / 100)) * 100) / 100;
    }
    if (category !== undefined) {
      if (typeof category !== "string" || category.trim().length < 2) return sendError(res, 400, "Category must be at least 2 characters.");
      updateData.category = category.trim().toLowerCase();
    }
    if (isAvailable !== undefined) {
      if (typeof isAvailable !== "boolean") return sendError(res, 400, "isAvailable must be a boolean.");
      if (isAvailable && existingProduct.stock === 0 && stock === undefined) {
        return sendError(res, 400, "Cannot make product active when stock is 0.");
      }
      updateData.isAvailable = isAvailable;
    }

    if (stock !== undefined) {
      const parsedStock = parseInt(stock, 10);
      if (isNaN(parsedStock) || parsedStock < 0) return sendError(res, 400, "Stock must be a non-negative integer.");
      updateData.stock = parsedStock;
      if (isAvailable === undefined) {
        updateData.isAvailable = parsedStock > 0;
      } else if (isAvailable && parsedStock === 0) {
        updateData.isAvailable = false;
      }
    }

    if (Object.keys(updateData).length === 0) return sendError(res, 400, "No valid fields provided for update.");

    const product = await prisma.product.update({ where: { id }, data: updateData });

    // ── Cache invalidation: product changes → products; stock changes → stores ──
    const invalidations = [
      cache.invalidate("products"),
      cache.invalidate("categories"),
      cache.invalidate(`product:${id}`),
    ];
    if (stock !== undefined) {
      invalidations.push(cache.invalidate("stores"));
    }
    await Promise.all(invalidations);

    logger.info({ productId: id }, "Product updated");
    return sendSuccess(res, 200, { product });
  } catch (error) {
    logger.error({ err: error }, "[UpdateProduct Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── DELETE /vendor/products/:id — Delete Product ───
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) return sendError(res, 403, "No vendor profile found.");

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) return sendError(res, 404, "No store found.");

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) return sendError(res, 404, "Product not found.");
    if (existingProduct.storeId !== store.id) return sendError(res, 403, "You can only delete your own products.");

    await prisma.product.delete({ where: { id } });

    await Promise.all([
      cache.invalidate("products"),
      cache.invalidate("categories"),
      cache.invalidate(`product:${id}`),
    ]);

    logger.info({ productId: id }, "Product deleted");
    return sendSuccess(res, 200, { message: "Product deleted successfully." });
  } catch (error) {
    logger.error({ err: error }, "[DeleteProduct Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

module.exports = {
  createStore,
  getVendorStore,
  updateStore,
  createProduct,
  getVendorProducts,
  updateProduct,
  deleteProduct,
};
