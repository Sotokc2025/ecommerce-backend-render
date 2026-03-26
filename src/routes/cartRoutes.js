// @ts-check
import express from "express";
import { body } from "express-validator";
import {
  addProductToCart,
  createCart,
  deleteCart,
  getCartById,
  getCartByUser,
  getCarts,
  syncCartItems,
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

/**
 * Express Router para el módulo de Carrito (Context 7 Standard). 🛡️🛒
 * Gestiona la persistencia atómica del estado de Zustand.
 * @type {import('express').Router}
 */
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Gestión de carritos de compra e integración Context 7
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Lista todos los carritos (Admin Only) 🛡️🔑
 *     tags: [Cart]
 */
router.get("/", authMiddleware, isAdmin, getCarts);

/**
 * @swagger
 * /api/cart/user/{id}:
 *   get:
 *     summary: Obtiene el carrito del usuario autenticado 🛡️👤
 *     tags: [Cart]
 */
router.get(
  "/user/:id",
  authMiddleware,
  mongoIdValidation("id", "User ID"),
  validate,
  getCartByUser
);

/**
 * @swagger
 * /api/cart/sync:
 *   post:
 *     summary: Sincronización ATÓMICA e IDEMPOTENTE (Handshake) 🛡️🔄🤝
 *     tags: [Cart]
 */
router.post(
  "/sync",
  authMiddleware,
  body("products").isArray().withMessage("Products must be an array"),
  body("products.*.productId").isMongoId().withMessage("Invalid Product ID"),
  body("products.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be >= 1"),
  validate,
  syncCartItems
);

/**
 * @swagger
 * /api/cart/add-product:
 *   post:
 *     summary: Agrega (incrementa) un producto al carrito 🛡️➕
 *     tags: [Cart]
 */
router.post(
  "/add-product",
  authMiddleware,
  bodyMongoIdValidation("productId", "Product ID"),
  quantityValidation("quantity", true),
  validate,
  addProductToCart,
);

/**
 * @swagger
 * /api/cart/update-item:
 *   put:
 *     summary: Actualiza manualmente la cantidad de un item 🛡️🔧
 *     tags: [Cart]
 */
router.put(
  "/update-item",
  authMiddleware,
  bodyMongoIdValidation("productId", "Product ID"),
  quantityValidation("quantity", false),
  validate,
  updateCartItem,
);

/**
 * @swagger
 * /api/cart/remove-item/{productId}:
 *   delete:
 *     summary: Elimina un producto del carrito 🛡️🗑️
 *     tags: [Cart]
 */
router.delete(
  "/remove-item/:productId",
  authMiddleware,
  mongoIdValidation("productId", "Product ID"),
  validate,
  removeCartItem
);

/**
 * @swagger
 * /api/cart/clear:
 *   post:
 *     summary: Vacía completamente el carrito del usuario 🛡️🧹
 *     tags: [Cart]
 */
router.post(
  "/clear",
  authMiddleware,
  clearCartItems
);

// --- RUTAS DE GESTIÓN AVANZADA (CRUD) ---

router.get("/:id", authMiddleware, isAdmin, mongoIdValidation("id", "Cart ID"), validate, getCartById);

router.post(
  "/",
  authMiddleware,
  bodyMongoIdValidation("user", "User ID"),
  body("products").isArray({ min: 1 }).withMessage("Inventory items required"),
  validate,
  createCart,
);

router.put("/:id", authMiddleware, isAdmin, mongoIdValidation("id", "Cart ID"), validate, updateCart);

router.delete("/:id", authMiddleware, isAdmin, mongoIdValidation("id", "Cart ID"), validate, deleteCart);

export default router;