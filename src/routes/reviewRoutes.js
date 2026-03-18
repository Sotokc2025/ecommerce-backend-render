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

// Crear una nueva review (requiere autenticación)
router.post(
  "/review",
  authMiddleware,
  [bodyMongoIdValidation("product", "Product ID"), ratingValidation(), commentValidation()],
  validate,
  createReview
);

// Obtener reviews de un producto específico
router.get(
  "/review/product/:productId",
  [mongoIdValidation("productId", "Product ID")],
  validate,
  getProductReviews
);

// Obtener reviews del usuario autenticado
router.get("/my-reviews", authMiddleware, getUserReviews);

// Actualizar una review (requiere autenticación)
router.put(
  "/review/:reviewId",
  authMiddleware,
  [mongoIdValidation("reviewId", "Review ID"), ratingValidation(true), commentValidation()],
  validate,
  updateReview
);

// Eliminar una review (requiere autenticación)
router.delete(
  "/review/:reviewId",
  authMiddleware,
  [mongoIdValidation("reviewId", "Review ID")],
  validate,
  deleteReview
);

export default router;
