import express from "express";
import {
    createPaymentMethod,
    deactivatePaymentMethod,
    deletePaymentMethod,
    getDefaultPaymentMethod,
    getPaymentMethodById,
    getPaymentMethods,
    getPaymentMethodsByUser,
    setDefaultPaymentMethod,
    updatePaymentMethod,
} from "../controllers/paymentMethodController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import validate from "../middlewares/validation.js";
import {
    accountNumberValidation,
    bankNameValidation,
    booleanValidation,
    cardHolderNameValidation,
    cardNumberValidation,
    expiryDateValidation,
    mongoIdValidation,
    paymentTypeValidation,
    paypalEmailValidation,
} from "../middlewares/validators.js";

const router = express.Router();

// Obtener todos los métodos de pago activos (admin)
router.get("/payment-methods", authMiddleware, isAdmin, getPaymentMethods);

// Obtener método de pago predeterminado del usuario autenticado
router.get("/payment-methods/default", authMiddleware, getDefaultPaymentMethod);

// Obtener métodos de pago del usuario autenticado
router.get("/payment-methods/me", authMiddleware, getPaymentMethodsByUser);

// Obtener método de pago por ID
router.get(
  "/payment-methods/:id",
  authMiddleware,
  [mongoIdValidation("id", "Payment method ID")],
  validate,
  getPaymentMethodById
);

// Crear nuevo método de pago
router.post(
  "/payment-methods",
  authMiddleware,
  [
    paymentTypeValidation(),
    cardNumberValidation(),
    cardHolderNameValidation(),
    expiryDateValidation(),
    paypalEmailValidation(),
    bankNameValidation(),
    accountNumberValidation(),
    booleanValidation("isDefault"),
  ],
  validate,
  createPaymentMethod
);

// Establecer método de pago como predeterminado
router.patch(
  "/payment-methods/:id/set-default",
  authMiddleware,
  [mongoIdValidation("id", "Payment method ID")],
  validate,
  setDefaultPaymentMethod
);

// Desactivar método de pago
router.patch(
  "/payment-methods/:id/deactivate",
  authMiddleware,
  [mongoIdValidation("id", "Payment method ID")],
  validate,
  deactivatePaymentMethod
);

// Actualizar método de pago
router.put(
  "/payment-methods/:id",
  authMiddleware,
  [
    mongoIdValidation("id", "Payment method ID"),
    cardHolderNameValidation(),
    expiryDateValidation(),
    paypalEmailValidation(),
    bankNameValidation(),
    accountNumberValidation(),
    booleanValidation("isDefault"),
    booleanValidation("isActive"),
  ],
  validate,
  updatePaymentMethod
);

// Eliminar método de pago permanentemente
router.delete(
  "/payment-methods/:id",
  authMiddleware,
  [mongoIdValidation("id", "Payment method ID")],
  validate,
  deletePaymentMethod
);

export default router;
