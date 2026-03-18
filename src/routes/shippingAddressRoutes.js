import express from "express";
import { body, param } from "express-validator";
import {
  createShippingAddress,
  deleteShippingAddress,
  getAddressById,
  getDefaultAddress,
  getUserAddresses,
  setDefaultAddress,
  updateShippingAddress,
} from "../controllers/shippingAddressController.js";
import authMiddleware from "../middlewares/authMiddleware.js"; // Middleware de autenticación
import validate from "../middlewares/validation.js";
import {
  nameValidation,
  addressLineValidation,
  cityValidation,
  stateValidation,
  postalCodeValidation,
  countryValidation,
  addressPhoneValidation,
  booleanValidation,
  addressTypeValidation,
  mongoIdValidation,
  nameOptionalValidation,
  addressLineOptionalValidation,
  cityOptionalValidation,
  stateOptionalValidation,
  postalCodeOptionalValidation,
  addressPhoneOptionalValidation,
} from "../middlewares/validators.js";

const router = express.Router();

// Validaciones comunes para crear/actualizar dirección
const addressValidations = [
  nameValidation(),
  addressLineValidation(),
  cityValidation(),
  stateValidation(),
  postalCodeValidation(),
  countryValidation(),
  addressPhoneValidation(),
  booleanValidation("isDefault"),
  addressTypeValidation(),
];

// Crear una nueva dirección (requiere autenticación)
router.post(
  "/shipping-address",
  authMiddleware,
  addressValidations,
  validate,
  createShippingAddress
);

// Obtener todas las direcciones del usuario
router.get("/shipping-address", authMiddleware, getUserAddresses);

// Obtener la dirección por defecto
router.get("/shipping-address/default", authMiddleware, getDefaultAddress);

// Obtener una dirección específica (requiere autenticación)
router.get(
  "/shipping-address/:addressId",
  authMiddleware,
  [mongoIdValidation("addressId", "Address ID")],
  validate,
  getAddressById
);

// Actualizar una dirección (requiere autenticación)
router.put(
  "/shipping-address/:addressId",
  authMiddleware,
  [
    mongoIdValidation("addressId", "Address ID"),
    nameOptionalValidation(),
    addressLineOptionalValidation(),
    cityOptionalValidation(),
    stateOptionalValidation(),
    postalCodeOptionalValidation(),
    countryValidation(),
    addressPhoneOptionalValidation(),
    booleanValidation("isDefault"),
    addressTypeValidation(),
  ],
  validate,
  updateShippingAddress
);

// Marcar dirección como default (requiere autenticación)
router.patch(
  "/shipping-address/:addressId/default",
  authMiddleware,
  [mongoIdValidation("addressId", "Address ID")],
  validate,
  setDefaultAddress
);

// Eliminar una dirección (requiere autenticación)
router.delete(
  "/shipping-address/:addressId",
  authMiddleware,
  [mongoIdValidation("addressId", "Address ID")],
  validate,
  deleteShippingAddress
);

export default router;
