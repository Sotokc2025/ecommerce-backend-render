// @ts-check
import Product from "../models/product.js";
import WishList from "../models/wishList.js";

// Obtener la wishlist del usuario
const getUserWishList = async (req, res, next) => {
  try {
    const userId = req.user.userId; // Asumiendo que tienes middleware de autenticación

    let wishList = await WishList.findOne({ user: userId })
      .populate("products.product", "name description price images imagesUrl category stock")
      .lean();

    if (!wishList) {
      // Devolver wishlist vacía sin persistirla (evita crear documento innecesario hasta que el usuario agregue algo)
      return res.status(200).json({
        message: "Wishlist retrieved successfully",
        count: 0,
        wishList: { user: userId, products: [] },
      });
    }

    res.status(200).json({
      message: "Wishlist retrieved successfully",
      count: Array.isArray(wishList.products) ? wishList.products.length : 0,
      wishList,
    });
  } catch (error) {
    next(error);
  }
};

// Agregar producto a la wishlist (operación atómica)
const addToWishList = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user.userId;

    // Verificar que el producto existe
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Usar $addToSet para evitar duplicados de forma atómica
    const updated = await WishList.findOneAndUpdate(
      { user: userId },
      { $addToSet: { products: { product: productId } } },
      { new: true, upsert: true }
    ).populate("products.product", "name description price images imagesUrl category stock");

    // Detectar si el producto se añadió realmente comparando conteo
    const exists = updated.products.some(
      (p) => p.product && p.product._id.toString() === productId
    );

    if (!exists) {
      // Esto es improbable con $addToSet + upsert, pero por seguridad
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    res.status(200).json({
      message: "Product added to wishlist successfully",
      wishList: updated,
      count: updated.products.length,
    });
  } catch (error) {
    next(error);
  }
};

// Remover producto de la wishlist (operación atómica)
const removeFromWishList = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    const updated = await WishList.findOneAndUpdate(
      { user: userId },
      { $pull: { products: { product: productId } } },
      { new: true }
    ).populate("products.product", "name description price images imagesUrl category stock");

    if (!updated) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    res.status(200).json({
      message: "Product removed from wishlist successfully",
      wishList: updated,
      count: updated.products.length,
    });
  } catch (error) {
    next(error);
  }
};

// Limpiar toda la wishlist
const clearWishList = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const updated = await WishList.findOneAndUpdate(
      { user: userId },
      { $set: { products: [] } },
      { new: true }
    );

    if (!updated) {
      // Crear un nuevo wishlist vacío si no existía
      const newWishList = await WishList.create({
        user: userId,
        products: [],
      });
      return res.status(200).json({
        message: "Wishlist cleared successfully",
        wishList: newWishList,
        count: 0,
      });
    }

    res.status(200).json({
      message: "Wishlist cleared successfully",
      wishList: updated,
      count: 0,
    });
  } catch (error) {
    next(error);
  }
};

// Verificar si un producto está en la wishlist
const checkProductInWishList = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    const wishList = await WishList.findOne({ user: userId }).lean();

    if (!wishList || !Array.isArray(wishList.products) || wishList.products.length === 0) {
      return res.status(200).json({ message: "Product not in wishlist", inWishList: false });
    }

    const productExists = wishList.products.some((item) => item.product.toString() === productId);

    res.status(200).json({
      message: productExists ? "Product is in wishlist" : "Product not in wishlist",
      inWishList: productExists,
    });
  } catch (error) {
    next(error);
  }
};

// Mover productos de wishlist al carrito (si tienes modelo de carrito)
const moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user.userId;

    // Remover del wishlist atómicamente
    const updated = await WishList.findOneAndUpdate(
      { user: userId },
      { $pull: { products: { product: productId } } },
      { new: true }
    ).populate("products.product", "name description price images imagesUrl category stock");

    if (!updated) return res.status(404).json({ message: "Wishlist not found" });

    // Aquí podrías agregar la lógica para insertar en el carrito del usuario.
    res.status(200).json({
      message: "Product moved to cart and removed from wishlist",
      wishList: updated,
    });
  } catch (error) {
    next(error);
  }
};

export {
  addToWishList,
  checkProductInWishList,
  clearWishList,
  getUserWishList,
  moveToCart,
  removeFromWishList,
};
