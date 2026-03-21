import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { tymcoChat } from "../controllers/tymcoController.js";

const router = express.Router();

/**
 * Rutas de TyMCO-Bot IA 🤖
 * Requieren autenticación para acceso a pedidos del usuario.
 */
router.post("/chat", authMiddleware, tymcoChat);

export default router;
