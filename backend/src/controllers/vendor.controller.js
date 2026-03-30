const prisma = require("../config/db");

// ─── POST /vendor/store — Create Store ───
const createStore = async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;

    // ── Input validation ──
    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "Name, address, latitude, and longitude are required." });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Store name must be at least 2 characters." });
    }

    if (typeof address !== "string" || address.trim().length < 5) {
      return res.status(400).json({ success: false, message: "Address must be at least 5 characters." });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ success: false, message: "Latitude must be a number between -90 and 90." });
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: "Longitude must be a number between -180 and 180." });
    }

    // ── Find vendor record for logged-in user ──
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) {
      return res.status(403).json({ success: false, message: "No vendor profile found. Register as VENDOR first." });
    }

    // ── Check if vendor already has a store ──
    const existingStore = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (existingStore) {
      return res.status(409).json({ success: false, message: "You already have a store. Use PATCH to update it." });
    }

    // ── Create store ──
    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        latitude: lat,
        longitude: lng,
        vendorId: vendor.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Store created successfully.",
      store,
    });
  } catch (error) {
    console.error("[CreateStore Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /vendor/store — Get Vendor's Store ───
const getVendorStore = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) {
      return res.status(403).json({ success: false, message: "No vendor profile found." });
    }

    const store = await prisma.store.findUnique({
      where: { vendorId: vendor.id },
      include: { _count: { select: { products: true } } },
    });

    if (!store) {
      return res.status(404).json({ success: false, message: "No store found. Create one first." });
    }

    return res.status(200).json({ success: true, store });
  } catch (error) {
    console.error("[GetVendorStore Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── POST /vendor/products — Create Product ───
const createProduct = async (req, res) => {
  try {
    const { name, description, basePrice, profitMargin, category, stock } = req.body;

    // ── Input validation ──
    if (!name || !description || basePrice === undefined || !category) {
      return res.status(400).json({ success: false, message: "Name, description, basePrice, and category are required." });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Product name must be at least 2 characters." });
    }

    if (typeof description !== "string" || description.trim().length < 5) {
      return res.status(400).json({ success: false, message: "Description must be at least 5 characters." });
    }

    const parsedBasePrice = parseFloat(basePrice);
    if (isNaN(parsedBasePrice) || parsedBasePrice <= 0) {
      return res.status(400).json({ success: false, message: "Base price must be a positive number." });
    }

    const parsedMargin = profitMargin !== undefined ? parseFloat(profitMargin) : 0;
    if (isNaN(parsedMargin) || parsedMargin < 0 || parsedMargin > 500) {
      return res.status(400).json({ success: false, message: "Profit margin must be between 0 and 500%." });
    }

    if (typeof category !== "string" || category.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Category must be at least 2 characters." });
    }

    const parsedStock = stock !== undefined ? parseInt(stock, 10) : 0;
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ success: false, message: "Stock must be a non-negative integer." });
    }

    // ── Calculate selling price ──
    const sellingPrice = Math.round((parsedBasePrice + (parsedBasePrice * parsedMargin / 100)) * 100) / 100;

    // ── Find vendor's store ──
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) {
      return res.status(403).json({ success: false, message: "No vendor profile found." });
    }

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) {
      return res.status(404).json({ success: false, message: "Create a store before adding products." });
    }

    // ── Create product ──
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

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error("[CreateProduct Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /vendor/products — Get Vendor's Products ───
const getVendorProducts = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) {
      return res.status(403).json({ success: false, message: "No vendor profile found." });
    }

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) {
      return res.status(404).json({ success: false, message: "No store found." });
    }

    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("[GetVendorProducts Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── PATCH /vendor/products/:id — Update Product ───
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, profitMargin, category, stock } = req.body;

    // ── Verify ownership ──
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) {
      return res.status(403).json({ success: false, message: "No vendor profile found." });
    }

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) {
      return res.status(404).json({ success: false, message: "No store found." });
    }

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (existingProduct.storeId !== store.id) {
      return res.status(403).json({ success: false, message: "You can only update your own products." });
    }

    // ── Build update data (only provided fields) ──
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: "Product name must be at least 2 characters." });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim().length < 5) {
        return res.status(400).json({ success: false, message: "Description must be at least 5 characters." });
      }
      updateData.description = description.trim();
    }

    if (basePrice !== undefined) {
      const parsedBase = parseFloat(basePrice);
      if (isNaN(parsedBase) || parsedBase <= 0) {
        return res.status(400).json({ success: false, message: "Base price must be a positive number." });
      }
      updateData.basePrice = parsedBase;
    }

    if (profitMargin !== undefined) {
      const parsedMargin = parseFloat(profitMargin);
      if (isNaN(parsedMargin) || parsedMargin < 0 || parsedMargin > 500) {
        return res.status(400).json({ success: false, message: "Profit margin must be between 0 and 500%." });
      }
      updateData.profitMargin = parsedMargin;
    }

    // Recalculate selling price if base or margin changed
    if (updateData.basePrice !== undefined || updateData.profitMargin !== undefined) {
      const finalBase = updateData.basePrice ?? existingProduct.basePrice;
      const finalMargin = updateData.profitMargin ?? existingProduct.profitMargin;
      updateData.price = Math.round((finalBase + (finalBase * finalMargin / 100)) * 100) / 100;
    }

    if (category !== undefined) {
      if (typeof category !== "string" || category.trim().length < 2) {
        return res.status(400).json({ success: false, message: "Category must be at least 2 characters." });
      }
      updateData.category = category.trim().toLowerCase();
    }

    if (stock !== undefined) {
      const parsedStock = parseInt(stock, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ success: false, message: "Stock must be a non-negative integer." });
      }
      updateData.stock = parsedStock;
      updateData.isAvailable = parsedStock > 0;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided for update." });
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error("[UpdateProduct Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── DELETE /vendor/products/:id — Delete Product ───
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // ── Verify ownership ──
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.userId } });
    if (!vendor) {
      return res.status(403).json({ success: false, message: "No vendor profile found." });
    }

    const store = await prisma.store.findUnique({ where: { vendorId: vendor.id } });
    if (!store) {
      return res.status(404).json({ success: false, message: "No store found." });
    }

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (existingProduct.storeId !== store.id) {
      return res.status(403).json({ success: false, message: "You can only delete your own products." });
    }

    await prisma.product.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("[DeleteProduct Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  createStore,
  getVendorStore,
  createProduct,
  getVendorProducts,
  updateProduct,
  deleteProduct,
};
