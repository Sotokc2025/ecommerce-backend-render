import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { tymcoChat } from "../controllers/tymcoController.js";

const router = express.Router();

/**
 * Rutas de TyMCO-Bot IA 🤖
 * Requieren autenticación para acceso a pedidos del usuario.
 */
/**
 * @swagger
 * /tymco/chat:
 *   post:
 *     summary: Chat con TyMCO-Bot IA
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Respuesta de la IA
 */
router.post("/chat", authMiddleware, tymcoChat);

export default router;
