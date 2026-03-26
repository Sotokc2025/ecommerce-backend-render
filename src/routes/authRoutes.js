// @ts-check
import express from "express";
import { body, query } from "express-validator";
import {
  checkEmail,
  login,
  register,
  refreshToken,
  logout
} from "../controllers/authController.js";
import validate from "../middlewares/validation.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import {
  displayNameValidation,
  emailValidation,
  passwordValidation,
  phoneValidation,
  urlValidation,
  roleValidation,
  queryEmailValidation,
  passwordLoginValidation,
} from "../middlewares/validators.js";

const router = express.Router();

// Aplicar rate limiting a todas las rutas de autenticación
router.use(authLimiter);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [displayName, email, password]
 *             properties:
 *               displayName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [customer, admin]
 *               avatar:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error en los datos o usuario ya existe
 */
router.post(
  "/register",
  [
    displayNameValidation(),
    emailValidation(),
    passwordValidation(),
    phoneValidation(),
    roleValidation(),
    urlValidation("avatar"),
  ],
  validate,
  register,
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Inicia sesión de un usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, retorna tokens
 *       400:
 *         description: Credenciales inválidas
 */
router.post(
  "/login",
  [emailValidation(), passwordLoginValidation()],
  validate,
  login,
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresca el token de acceso
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nuevo token generado
 *       403:
 *         description: Refresh token inválido
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /auth/check-email:
 *   get:
 *     summary: Verifica si un email ya está registrado
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna si está tomado o no
 */
router.get("/check-email", [queryEmailValidation()], validate, checkEmail);

router.get("/check-email", [queryEmailValidation()], validate, checkEmail);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cierra la sesión y limpia las cookies
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Responde con éxito
 */
router.post("/logout", logout);

export default router;
