// @ts-check
import Cart from "../models/cart.js";

/**
 * @typedef {import('../middlewares/authMiddleware').UserPayload} UserPayload
 * @typedef {import('../middlewares/authMiddleware').AuthRequest} AuthRequest
 * @typedef {import('express').Response} ExpressResponse
 * @typedef {import('express').NextFunction} NextFunction
 * 
 * @typedef {(req: AuthRequest, res: ExpressResponse, next: NextFunction) => Promise<any>} AuthRequestHandler
 */

/** 
 * Interfaz extendida para documentos de Mongoose (Context 7 Standard) 🛡️🧬
 * @typedef {import('mongoose').Document & { products: Array<{product: any, quantity: number}>, user: any, save: Function, populate: Function }} CartDocument
 */

/** @type {AuthRequestHandler} */
async function getCarts(req, res, next) {
  try {
    const carts = await Cart.find()
      .populate("user")
      .populate("products.product");
    return res.json(carts);
  } catch (error) {
    next(error);
  }
}

/** @type {AuthRequestHandler} */
async function getCartById(req, res, next) {
  try {
    const id = req.params.id;
    const cart = await Cart.findById(id)
      .populate("user")
      .populate("products.product");
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    return res.json(cart);
  } catch (error) {
    next(error);
  }
}

/** @type {AuthRequestHandler} */
async function getCartByUser(req, res, next) {
  try {
    const userId = req.params.id;
    const currentUser = req.user;

    const authenticatedUserId = currentUser?.userId;

    if (userId !== authenticatedUserId && currentUser?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Access denied to other user's cart" });
    }

    const cart = await Cart.findOne({ user: userId })
      .populate("user")
      .populate("products.product");

    if (!cart) {
      return res.status(200).json({ message: "No cart found for this user", cart: null });
    }
    return res.json({ message: "Cart retrieved successfully", cart });
  } catch (error) {
    next(error);
  }
}

/** @type {AuthRequestHandler} */
async function createCart(req, res, next) {
  try {
    const { user, products } = req.body;
    const newCart = await Cart.create({ user, products });
    await newCart.populate("user");
    await newCart.populate("products.product");
    return res.status(201).json(newCart);
  } catch (error) {
    next(error);
  }
}

/** @type {AuthRequestHandler} */
async function updateCart(req, res, next) {
  try {
    const { id } = req.params;
    const { user, products } = req.body;

    if (user === undefined && products === undefined) {
      return res.status(400).json({ message: "Context 7 Violation: User or products required" });
    }

    const updateData = {};
    if (user !== undefined) Object.assign(updateData, { user });
    if (products !== undefined) Object.assign(updateData, { products });

    const updatedCart = await Cart.findByIdAndUpdate(id, updateData, { new: true })
      .populate("user")
      .populate("products.product");

    if (updatedCart) {
      return res.status(200).json(updatedCart);
    } else {
      return res.status(404).json({ message: "Cart not found" });
    }
  } catch (error) {
    next(error);
  }
}

/** @type {AuthRequestHandler} */
async function deleteCart(req, res, next) {
  try {
    const { id } = req.params;
    const deletedCart = await Cart.findByIdAndDelete(id);
    if (deletedCart) {
      return res.status(204).send();
    } else {
      return res.status(404).json({ message: "Cart not found" });
    }
  } catch (error) {
    next(error);
  }
}

/** @type {AuthRequestHandler} */
async function addProductToCart(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Context 7: Unauthorized - Session required" });
    }

    /** @type {CartDocument | null} */
    let cart = /** @type {any} */ (await Cart.findOne({ user: userId }));

    if (!cart) {
      cart = /** @type {any} */ (new Cart({
        user: userId,
        products: [{ product: productId, quantity }],
      }));
    } else {
      const existingProductIndex = cart.products.findIndex((item) => item.product?.toString() === productId);
      if (existingProductIndex >= 0) {
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }
    }

    if (cart) {
      await cart.save();
      await cart.populate("user");
      await cart.populate("products.product");
    }

    return res.status(200).json({ message: "Product added to cart", cart });
  } catch (error) {
    next(error);
  }
}

/** @type {AuthRequestHandler} */
async function updateCartItem(req, res, next) {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?.userId;

    /** @type {CartDocument | null} */
    const cart = /** @type {any} */ (await Cart.findOne({ user: userId }));
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const productIndex = cart.products.findIndex((item) => item.product?.toString() === productId);
    if (productIndex === -1) return res.status(404).json({ message: "Product not in Cart" });

    cart.products[productIndex].quantity = quantity;
    await cart.save();
    await cart.populate("user");
    await cart.populate("products.product");

    return res.json({ message: "Cart item updated", cart });
  } catch (error) {
    next(error);
  }
}

/** @type {AuthRequestHandler} */
async function removeCartItem(req, res, next) {
  try {
    const { productId } = req.params;
    const userId = req.user?.userId;

    /** @type {CartDocument | null} */
    const cart = /** @type {any} */ (await Cart.findOne({ user: userId }));
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.products = cart.products.filter((item) => item.product?.toString() !== productId);
    await cart.save();
    await cart.populate("user");
    await cart.populate("products.product");

    return res.json({ message: "Product removed from cart", cart });
  } catch (error) {
    next(error);
  }
}

/** @type {AuthRequestHandler} */
async function clearCartItems(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Context 7: Session missing" });

    /** @type {CartDocument | null} */
    const cart = /** @type {any} */ (await Cart.findOne({ user: userId }));
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.products = [];
    await cart.save();
    await cart.populate("user");
    return res.json({ message: "Cart Context 7: Cleared", cart });
  } catch (error) {
    next(error);
  }
}

/** 
 * Sincronización ATÓMICA e IDEMPOTENTE (Context 7 Standard) 🛡️🔄🧬
 * @type {AuthRequestHandler}
 */
async function syncCartItems(req, res, next) {
  try {
    const { products } = req.body;
    const userId = req.user?.userId;

    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "Format Error: Context 7 expects an array" });
    }

    /** @type {CartDocument | null} */
    let cart = /** @type {any} */ (await Cart.findOne({ user: userId }));

    const normalizedProducts = products.map((p) => ({
      product: p.productId || p.id || p._id,
      quantity: p.quantity,
    }));

    if (!cart) {
      cart = /** @type {any} */ (new Cart({ user: userId, products: normalizedProducts }));
    } else {
      cart.products = normalizedProducts;
    }

    if (cart) {
      await cart.save();
      await cart.populate("user");
      await cart.populate("products.product");
    }

    return res.json({ message: "Context 7 Sync Handshake Success", cart });
  } catch (error) {
    next(error);
  }
}

export {
  addProductToCart,
  createCart,
  deleteCart,
  getCartById,
  getCartByUser,
  getCarts,
  updateCart,
  updateCartItem,
  removeCartItem,
  clearCartItems,
  syncCartItems,
};
