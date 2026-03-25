import express from "express";
import { body, param } from "express-validator";
import {
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
} from "../controllers/cartController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  mongoIdValidation,
  bodyMongoIdValidation,
  quantityValidation,
} from "../middlewares/validators.js";

const router = express.Router();

/**
 * @swagger
 * /cart/user/{id}:
 *   get:
 *     summary: Obtiene el carrito de un usuario
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del carrito
 */
router.get(
  "/cart/user/:id",
  authMiddleware,
  [mongoIdValidation("id", "User ID")],
  validate,
  getCartByUser,
);

/**
 * @swagger
 * /cart/add-product:
 *   post:
 *     summary: Agrega un producto al carrito
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Producto agregado
 */
router.post(
  "/cart/add-product",
  authMiddleware,
  [
    bodyMongoIdValidation("productId", "Product ID"),
    quantityValidation("quantity", true),
  ],
  validate,
  addProductToCart,
);

router.get(
  "/cart/:id",
  authMiddleware,
  isAdmin,
  [mongoIdValidation("id", "Cart ID")],
  validate,
  getCartById,
);

router.post(
  "/cart",
  authMiddleware,
  [
    bodyMongoIdValidation("user", "User"),
    body("products")
      .notEmpty()
      .withMessage("Products are required")
      .isArray({ min: 1 })
      .withMessage("Products must be a non-empty array"),
    bodyMongoIdValidation("products.*.product", "Product ID"),
    quantityValidation("products.*.quantity"),
  ],
  validate,
  createCart,
);

router.put(
  "/cart-item/:id",
  authMiddleware,
  [
    mongoIdValidation("id", "Cart ID"),
    bodyMongoIdValidation("user", "User ID", true),
    body("products")
      .optional()
      .isArray({ min: 1 })
      .withMessage("Products must be a non-empty array"),
    bodyMongoIdValidation("products.*.product", "Product ID", true),
    quantityValidation("products.*.quantity", true),
  ],
  validate,
  updateCart,
);

router.delete(
  "/cart/:id",
  authMiddleware,
  [mongoIdValidation("id", "Cart ID")],
  validate,
  deleteCart,
);

// Rutas nuevas
router.put(
  "/cart/update-item",
  authMiddleware,
  [
    bodyMongoIdValidation("productId", "Product ID"),
    quantityValidation("quantity", true),
  ],
  validate,
  updateCartItem,
);

router.delete(
  "/cart/remove-item/:productId",
  authMiddleware,
  [
    mongoIdValidation("productId", "Product ID"),
  ],
  validate,
  removeCartItem,
);

router.post(
  "/cart/clear",
  authMiddleware,
  [],
  validate,
  clearCartItems,
);

export default router;
