import express from "express";
import { createPaymentIntent } from "../controllers/paymentController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import { bodyMongoIdValidation } from "../middlewares/validators.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Endpoints for processing real financial payments
 */

/**
 * @swagger
 * /create-payment-intent:
 *   post:
 *     summary: Genera un PaymentIntent de Stripe para una orden pendiente
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Client Secret returnado con éxito
 *       400:
 *         description: Error en la solicitud u orden ya pagada
 */
router.post(
  "/create-payment-intent",
  authMiddleware,
  [bodyMongoIdValidation("orderId", "Order ID")],
  validate,
  createPaymentIntent
);

export default router;
