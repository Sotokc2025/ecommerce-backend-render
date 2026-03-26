// @ts-check
import express from "express";
import { body, param, query } from "express-validator";
import {
  changePassword,
  createUser,
  deactivateUser,
  deleteUser,
  getAllUsers,
  getUserById,
  getUserProfile,
  searchUser,
  toggleUserStatus,
  updateUser,
  updateUserProfile,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js"; // Middleware de autenticación
import isAdmin from "../middlewares/isAdminMiddleware.js"; // Middleware de admin
import validate from "../middlewares/validation.js";
import {
  displayNameValidation,
  emailValidation,
  passwordValidation,
  phoneValidation,
  urlValidation,
  paginationValidation,
  mongoIdValidation,
  roleValidation,
  booleanValidation,
  userDisplayNameValidation,
  fullPasswordValidation,
  newPasswordValidation,
  confirmPasswordValidation,
  queryRoleValidation,
  queryIsActiveValidation,
  searchQueryValidation,
  sortFieldValidation,
  orderValidation,
} from "../middlewares/validators.js";

const router = express.Router();

// Validaciones comunes para actualizar perfil
const profileValidations = [
  userDisplayNameValidation(false),
  emailValidation(true),
  phoneValidation(),
  urlValidation("avatar"),
];

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints for user management
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del perfil del usuario
 */
// Obtener perfil del usuario autenticado
router.get("/users/profile", authMiddleware, getUserProfile);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtiene todos los usuarios (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios
 */
// Obtener todos los usuarios (solo admin)
router.get(
  "/users",
  authMiddleware,
  isAdmin,
  [...paginationValidation(), queryRoleValidation(), queryIsActiveValidation()],
  validate,
  getAllUsers
);

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Busca usuarios por términos
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultados de la búsqueda
 */
// Buscar usuarios (requiere autenticación)
router.get(
  "/users/search",
  authMiddleware,
  [
    searchQueryValidation(),
    ...paginationValidation(),
    queryRoleValidation(),
    queryIsActiveValidation(),
    sortFieldValidation(["email", "displayName", "createdAt"]),
    orderValidation(),
  ],
  validate,
  searchUser
);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Obtiene un usuario por ID (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del usuario
 */
// Obtener usuario por ID (solo admin)
router.get(
  "/users/:userId",
  authMiddleware,
  isAdmin,
  [mongoIdValidation("userId", "User ID")],
  validate,
  getUserById
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crea un nuevo usuario (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - displayName
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               displayName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 */
// Crear nuevo usuario (solo admin)
router.post(
  "/users",
  authMiddleware,
  isAdmin,
  [
    userDisplayNameValidation(true),
    emailValidation(),
    fullPasswordValidation(),
    phoneValidation(),
    urlValidation("avatar"),
    roleValidation(),
    booleanValidation("isActive"),
  ],
  validate,
  createUser
);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Actualiza el perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado
 */
// Actualizar perfil del usuario (requiere autenticación)
router.put("/users/profile", authMiddleware, profileValidations, validate, updateUserProfile);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Cambia la contraseña del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 */
// Cambiar contraseña (requiere autenticación)
router.put(
  "/users/change-password",
  authMiddleware,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    newPasswordValidation(),
    confirmPasswordValidation(),
  ],
  validate,
  changePassword
);

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Actualiza un usuario específico (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               displayName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
// Actualizar usuario (solo admin)
router.put(
  "/users/:userId",
  authMiddleware,
  isAdmin,
  [
    mongoIdValidation("userId", "User ID"),
    ...profileValidations,
    roleValidation(),
    booleanValidation("isActive"),
  ],
  validate,
  updateUser
);

/**
 * @swagger
 * /users/deactivate:
 *   patch:
 *     summary: Desactiva la cuenta del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cuenta desactivada
 */
// Desactivar cuenta propia
router.patch("/users/deactivate", authMiddleware, deactivateUser);

/**
 * @swagger
 * /users/{userId}/toggle-status:
 *   patch:
 *     summary: Activa o desactiva un usuario (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado del usuario alternado
 */
// Activar/Desactivar usuario (solo admin)
router.patch(
  "/users/:userId/toggle-status",
  authMiddleware,
  isAdmin,
  [mongoIdValidation("userId", "User ID")],
  validate,
  toggleUserStatus
);

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Elimina permanentemente un usuario (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
// Eliminar usuario (solo admin)
router.delete(
  "/users/:userId",
  authMiddleware,
  isAdmin,
  [mongoIdValidation("userId", "User ID")],
  validate,
  deleteUser
);

export default router;
