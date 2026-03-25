import express from "express";
import { body, param } from "express-validator";
import {
  createReview,
  deleteReview,
  getProductReviews,
  getUserReviews,
  updateReview,
} from "../controllers/reviewController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  mongoIdValidation,
  bodyMongoIdValidation,
  ratingValidation,
  commentValidation,
} from "../middlewares/validators.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Endpoints for product reviews
 */

/**
 * @swagger
 * /review:
 *   post:
 *     summary: Crea una nueva review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - rating
 *               - comment
 *             properties:
 *               product:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reseña creada exitosamente
 *       400:
 *         description: Error de validación
 */
// Crear una nueva review (requiere autenticación)
router.post(
  "/review",
  authMiddleware,
  [bodyMongoIdValidation("product", "Product ID"), ratingValidation(), commentValidation()],
  validate,
  createReview
);

/**
 * @swagger
 * /review/product/{productId}:
 *   get:
 *     summary: Obtiene las reviews de un producto específico
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Lista de reseñas del producto
 */
// Obtener reviews de un producto específico
router.get(
  "/review/product/:productId",
  [mongoIdValidation("productId", "Product ID")],
  validate,
  getProductReviews
);

/**
 * @swagger
 * /my-reviews:
 *   get:
 *     summary: Obtiene las reviews del usuario autenticado
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reseñas del usuario
 */
// Obtener reviews del usuario autenticado
router.get("/my-reviews", authMiddleware, getUserReviews);

/**
 * @swagger
 * /review/{reviewId}:
 *   put:
 *     summary: Actualiza una review existente
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reseña actualizada
 */
// Actualizar una review (requiere autenticación)
router.put(
  "/review/:reviewId",
  authMiddleware,
  [mongoIdValidation("reviewId", "Review ID"), ratingValidation(true), commentValidation()],
  validate,
  updateReview
);

/**
 * @swagger
 * /review/{reviewId}:
 *   delete:
 *     summary: Elimina una review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reseña eliminada
 */
// Eliminar una review (requiere autenticación)
router.delete(
  "/review/:reviewId",
  authMiddleware,
  [mongoIdValidation("reviewId", "Review ID")],
  validate,
  deleteReview
);

export default router;
