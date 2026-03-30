const prisma = require("../config/db");

// ─── POST /cart/add — Add or Update Cart Item ───
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.userId;

    // Validate inputs
    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, message: "productId and quantity are required." });
    }

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ success: false, message: "Quantity must be greater than 0." });
    }

    // Check if product exists and is available
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isAvailable) {
      return res.status(404).json({ success: false, message: "Product is currently unavailable." });
    }

    if (parsedQuantity > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} items left in stock.` });
    }

    // Find or create User's Cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, storeId: product.storeId },
      });
    } else {
      // Enforce single-store cart logic
      if (cart.storeId && cart.storeId !== product.storeId) {
        return res.status(400).json({ 
          success: false, 
          message: "Your cart already contains items from another store. Please checkout or clear your cart first." 
        });
      }

      // If cart was completely emptied and storeId was set to null, update it
      if (!cart.storeId) {
        cart = await prisma.cart.update({
          where: { id: cart.id },
          data: { storeId: product.storeId },
        });
      }
    }

    // Check if CartItem already exists
    let cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
    });

    if (cartItem) {
      const newQuantity = cartItem.quantity + parsedQuantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({ success: false, message: `Cannot add more. Only ${product.stock} items left in stock.` });
      }

      cartItem = await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: parsedQuantity,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Item added to cart successfully.",
      cartItem,
    });
  } catch (error) {
    console.error("[AddToCart Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /cart — Retrieve User Cart ───
const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        store: {
          select: { id: true, name: true, address: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, description: true, stock: true, isAvailable: true },
            },
          },
          orderBy: { createdAt: 'asc' }
        },
      },
    });

    if (!cart) {
      return res.status(200).json({ success: true, cart: { items: [], total: 0 } });
    }

    // Calculate dynamic total
    const total = cart.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);

    return res.status(200).json({
      success: true,
      cart: {
        ...cart,
        total,
      },
    });
  } catch (error) {
    console.error("[GetCart Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── PATCH /cart/item/:id — Update Quantity ───
const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.userId;

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ success: false, message: "Quantity must be greater than 0." });
    }

    // Ensure user owns this cart item
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      return res.status(404).json({ success: false, message: "Cart item not found." });
    }

    if (parsedQuantity > cartItem.product.stock) {
      return res.status(400).json({ success: false, message: `Only ${cartItem.product.stock} items available.` });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity: parsedQuantity },
    });

    return res.status(200).json({
      success: true,
      message: "Cart item updated.",
      cartItem: updatedItem,
    });
  } catch (error) {
    console.error("[UpdateCartItem Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── DELETE /cart/item/:id — Remove Item ───
const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    const cartItem = await prisma.cartItem.findUnique({ where: { id } });
    if (!cartItem || cartItem.cartId !== cart.id) {
      return res.status(404).json({ success: false, message: "Cart item not found." });
    }

    await prisma.cartItem.delete({ where: { id } });

    // If cart is now empty, clear the bound storeId
    const remainingItemsCount = await prisma.cartItem.count({ where: { cartId: cart.id } });
    if (remainingItemsCount === 0) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { storeId: null },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Item removed from cart.",
    });
  } catch (error) {
    console.error("[RemoveCartItem Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─── DELETE /cart/clear — Empty Cart ───
const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      prisma.cart.update({ where: { id: cart.id }, data: { storeId: null } })
    ]);

    return res.status(200).json({
      success: true,
      message: "Cart clear success.",
    });
  } catch (error) {
    console.error("[ClearCart Error]", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
