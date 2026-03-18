import express from "express";
import { body, param } from "express-validator";
import {
  addToWishList,
  checkProductInWishList,
  clearWishList,
  getUserWishList,
  moveToCart,
  removeFromWishList,
} from "../controllers/wishListController.js";
import authMiddleware from "../middlewares/authMiddleware.js"; // Middleware de autenticación
import validate from "../middlewares/validation.js";
import { mongoIdValidation, bodyMongoIdValidation } from "../middlewares/validators.js";

const router = express.Router();

// Obtener la wishlist del usuario
router.get("/wishList", authMiddleware, getUserWishList);

// Agregar producto a la wishlist
router.post(
  "/wishList/add",
  authMiddleware,
  [bodyMongoIdValidation("productId", "Product ID")],
  validate,
  addToWishList
);

// Verificar si un producto está en la wishlist
router.get(
  "/wishList/check/:productId",
  authMiddleware,
  [mongoIdValidation("productId", "Product ID")],
  validate,
  checkProductInWishList
);

// Remover producto de la wishlist
router.delete(
  "/wishList/remove/:productId",
  authMiddleware,
  [mongoIdValidation("productId", "Product ID")],
  validate,
  removeFromWishList
);

// Mover producto al carrito
router.post(
  "/wishList/move-to-cart",
  authMiddleware,
  [bodyMongoIdValidation("productId", "Product ID")],
  validate,
  moveToCart
);

// Limpiar toda la wishlist
router.delete("/wishList/clear", authMiddleware, clearWishList);

export default router;
