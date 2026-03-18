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

// Obtener perfil del usuario autenticado
router.get("/users/profile", authMiddleware, getUserProfile);

// Obtener todos los usuarios (solo admin)
router.get(
  "/users",
  authMiddleware,
  isAdmin,
  [...paginationValidation(), queryRoleValidation(), queryIsActiveValidation()],
  validate,
  getAllUsers
);

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

// Obtener usuario por ID (solo admin)
router.get(
  "/users/:userId",
  authMiddleware,
  isAdmin,
  [mongoIdValidation("userId", "User ID")],
  validate,
  getUserById
);

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

// Actualizar perfil del usuario (requiere autenticación)
router.put("/users/profile", authMiddleware, profileValidations, validate, updateUserProfile);

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

// Desactivar cuenta propia
router.patch("/users/deactivate", authMiddleware, deactivateUser);

// Activar/Desactivar usuario (solo admin)
router.patch(
  "/users/:userId/toggle-status",
  authMiddleware,
  isAdmin,
  [mongoIdValidation("userId", "User ID")],
  validate,
  toggleUserStatus
);

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
