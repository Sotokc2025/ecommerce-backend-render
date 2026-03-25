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

/**
 * @swagger
 * tags:
 *   name: PaymentMethods
 *   description: Endpoints for user payment methods
 */

/**
 * @swagger
 * /payment-methods:
 *   get:
 *     summary: Obtiene todos los métodos de pago activos (admin)
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de métodos de pago
 */
// Obtener todos los métodos de pago activos (admin)
router.get("/payment-methods", authMiddleware, isAdmin, getPaymentMethods);

/**
 * @swagger
 * /payment-methods/default:
 *   get:
 *     summary: Obtiene el método de pago predeterminado del usuario autenticado
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Método de pago predeterminado
 *       404:
 *         description: No se encontró método predeterminado
 */
// Obtener método de pago predeterminado del usuario autenticado
router.get("/payment-methods/default", authMiddleware, getDefaultPaymentMethod);

/**
 * @swagger
 * /payment-methods/me:
 *   get:
 *     summary: Obtiene todos los métodos de pago del usuario autenticado
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de métodos de pago del usuario
 */
// Obtener métodos de pago del usuario autenticado
router.get("/payment-methods/me", authMiddleware, getPaymentMethodsByUser);

/**
 * @swagger
 * /payment-methods/{id}:
 *   get:
 *     summary: Obtiene un método de pago por ID
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Método de pago
 */
// Obtener método de pago por ID
router.get(
  "/payment-methods/:id",
  authMiddleware,
  [mongoIdValidation("id", "Payment method ID")],
  validate,
  getPaymentMethodById
);

/**
 * @swagger
 * /payment-methods:
 *   post:
 *     summary: Crea un nuevo método de pago
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - cardNumber
 *               - cardHolderName
 *               - expiryDate
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [CREDIT_CARD, DEBIT_CARD, PAYPAL, BANK_TRANSFER]
 *               cardNumber:
 *                 type: string
 *               cardHolderName:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Método de pago creado
 */
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

/**
 * @swagger
 * /payment-methods/{id}/set-default:
 *   patch:
 *     summary: Establece un método de pago como predeterminado
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Método de pago actualizado a predeterminado
 */
// Establecer método de pago como predeterminado
router.patch(
  "/payment-methods/:id/set-default",
  authMiddleware,
  [mongoIdValidation("id", "Payment method ID")],
  validate,
  setDefaultPaymentMethod
);

/**
 * @swagger
 * /payment-methods/{id}/deactivate:
 *   patch:
 *     summary: Desactiva un método de pago
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Método de pago desactivado
 */
// Desactivar método de pago
router.patch(
  "/payment-methods/:id/deactivate",
  authMiddleware,
  [mongoIdValidation("id", "Payment method ID")],
  validate,
  deactivatePaymentMethod
);

/**
 * @swagger
 * /payment-methods/{id}:
 *   put:
 *     summary: Actualiza un método de pago
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               cardHolderName:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Método de pago actualizado
 */
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

/**
 * @swagger
 * /payment-methods/{id}:
 *   delete:
 *     summary: Elimina un método de pago permanentemente
 *     tags: [PaymentMethods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Método de pago eliminado
 */
// Eliminar método de pago permanentemente
router.delete(
  "/payment-methods/:id",
  authMiddleware,
  [mongoIdValidation("id", "Payment method ID")],
  validate,
  deletePaymentMethod
);

export default router;
