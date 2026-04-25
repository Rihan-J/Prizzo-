const prisma = require("../config/db");
const cache = require("../utils/cache");
const logger = require("../utils/logger");
const { sendSuccess, sendError } = require("../utils/response");

// ─── POST /cart/add — Add or Update Cart Item (returns full cart) ───
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.userId;

    if (!productId || quantity === undefined) {
      return sendError(res, 400, "productId and quantity are required.");
    }

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return sendError(res, 400, "Quantity must be greater than 0.");
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isAvailable) {
      return sendError(res, 404, "Product is currently unavailable.");
    }

    if (parsedQuantity > product.stock) {
      return sendError(res, 400, `Only ${product.stock} items left in stock.`);
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, storeId: product.storeId },
      });
    } else {
      if (cart.storeId && cart.storeId !== product.storeId) {
        return sendError(res, 400, "Your cart already contains items from another store. Please checkout or clear your cart first.");
      }
      if (!cart.storeId) {
        cart = await prisma.cart.update({
          where: { id: cart.id },
          data: { storeId: product.storeId },
        });
      }
    }

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
        return sendError(res, 400, `Cannot add more. Only ${product.stock} items left in stock.`);
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

    // Return updated cart state to avoid separate GET call
    const updatedCart = await getCartData(userId);
    logger.info({ userId, productId, qty: parsedQuantity }, "Item added to cart");

    return sendSuccess(res, 200, { cart: updatedCart });
  } catch (error) {
    logger.error({ err: error }, "[AddToCart Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── GET /cart — Retrieve User Cart ───
const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartData = await getCartData(userId);
    return sendSuccess(res, 200, { cart: cartData });
  } catch (error) {
    logger.error({ err: error }, "[GetCart Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── PATCH /cart/item/:id — Update Quantity (returns updated cart) ───
const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.userId;

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return sendError(res, 400, "Quantity must be greater than 0.");
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return sendError(res, 404, "Cart not found.");
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      return sendError(res, 404, "Cart item not found.");
    }

    if (parsedQuantity > cartItem.product.stock) {
      return sendError(res, 400, `Only ${cartItem.product.stock} items available.`);
    }

    await prisma.cartItem.update({
      where: { id },
      data: { quantity: parsedQuantity },
    });

    const updatedCart = await getCartData(userId);
    return sendSuccess(res, 200, { cart: updatedCart });
  } catch (error) {
    logger.error({ err: error }, "[UpdateCartItem Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── DELETE /cart/item/:id — Remove Item (returns updated cart) ───
const selectCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { isSelected } = req.body;
    const userId = req.user.userId;

    if (typeof isSelected !== "boolean") {
      return sendError(res, 400, "isSelected must be a boolean.");
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return sendError(res, 404, "Cart not found.");
    }

    const cartItem = await prisma.cartItem.findUnique({ where: { id } });
    if (!cartItem || cartItem.cartId !== cart.id) {
      return sendError(res, 404, "Cart item not found.");
    }

    await prisma.cartItem.update({
      where: { id },
      data: { isSelected },
    });

    const updatedCart = await getCartData(userId);
    return sendSuccess(res, 200, { cart: updatedCart });
  } catch (error) {
    logger.error({ err: error }, "[SelectCartItem Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return sendError(res, 404, "Cart not found.");
    }

    const cartItem = await prisma.cartItem.findUnique({ where: { id } });
    if (!cartItem || cartItem.cartId !== cart.id) {
      return sendError(res, 404, "Cart item not found.");
    }

    await prisma.cartItem.delete({ where: { id } });

    const remainingItemsCount = await prisma.cartItem.count({ where: { cartId: cart.id } });
    if (remainingItemsCount === 0) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { storeId: null },
      });
    }

    const updatedCart = await getCartData(userId);
    return sendSuccess(res, 200, { cart: updatedCart });
  } catch (error) {
    logger.error({ err: error }, "[RemoveCartItem Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── DELETE /cart/clear — Empty Cart ───
const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return sendError(res, 404, "Cart not found.");
    }

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      prisma.cart.update({ where: { id: cart.id }, data: { storeId: null } })
    ]);

    logger.info({ userId }, "Cart cleared");
    return sendSuccess(res, 200, { cart: { items: [], total: 0, selectedTotal: 0, selectedCount: 0, storeId: null } });
  } catch (error) {
    logger.error({ err: error }, "[ClearCart Error]");
    return sendError(res, 500, "Internal server error.");
  }
};

// ─── Shared helper: fetch complete cart data ───
async function getCartData(userId) {
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
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) {
    return { items: [], total: 0, selectedTotal: 0, selectedCount: 0, storeId: null };
  }

  const total = cart.items.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
  const selectedItems = cart.items.filter((item) => item.isSelected);
  const selectedTotal = selectedItems.reduce((sum, item) => sum + (item.quantity * item.product.price), 0);
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    ...cart,
    total,
    selectedTotal,
    selectedCount,
  };
}

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  selectCartItem,
  removeCartItem,
  clearCart,
};
