// @ts-check
import { body, param, query } from "express-validator";

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * @param {boolean} optional
 * @returns {any}
 */
export const emailValidation = (optional = false) => {
  const validator = body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail()
    .trim();

  return optional ? validator.optional() : validator.notEmpty().withMessage("Email is required");
};

/**
 * @returns {any}
 */
export const passwordValidation = () =>
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain at least one letter");

/**
 * @param {boolean} optional
 * @returns {any}
 */
export const displayNameValidation = (optional = false) => {
  const validator = body("displayName")
    .isLength({ min: 2, max: 50 })
    .withMessage("Display name must be between 2 and 50 characters")
    .trim()
    .escape();

  return optional
    ? validator.optional()
    : validator.notEmpty().withMessage("Display name is required");
};

/**
 * @returns {any}
 */
export const phoneValidation = () =>
  body("phone")
    .optional()
    .isLength({ min: 10, max: 10 })
    .withMessage("Phone must be exactly 10 digits")
    .matches(/^[0-9]+$/)
    .withMessage("Phone must contain only numbers");

/**
 * @param {string} field
 * @param {string|null} customLabel
 * @returns {any}
 */
export const mongoIdValidation = (field = "id", customLabel = null) => {
  const label = customLabel || field;
  return param(field).isMongoId().withMessage(`${label} must be a valid MongoDB ObjectId`);
};

/**
 * @returns {any[]}
 */
export const paginationValidation = () => [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

/**
 * @param {string} field
 * @returns {any}
 */
export const priceValidation = (field = "price") =>
  body(field).isFloat({ min: 0 }).withMessage(`${field} must be a positive number`);

/**
 * @param {string} field
 * @returns {any}
 */
export const priceOptionalValidation = (field = "price") =>
  body(field)
    .optional()
    .isFloat({ min: 0 })
    .withMessage(`${field} must be a positive number`);

/**
 * @param {string} field
 * @returns {any}
 */
export const descriptionValidation = (field = "description") =>
  body(field)
    .optional()
    .isLength({ max: 2000 })
    .withMessage(`${field} must not exceed 2000 characters`)
    .trim()
    .escape();

/**
 * @param {string} field
 * @returns {any}
 */
export const urlValidation = (field = "url") =>
  body(field).optional().isURL().withMessage(`${field} must be a valid URL`);

/**
 * @param {string} field
 * @param {string} label
 * @param {boolean} optional
 * @returns {any}
 */
export const bodyMongoIdValidation = (field, label, optional = false) => {
  const validator = body(field).isMongoId().withMessage(`Invalid ${label} format`);
  return optional ? validator.optional() : validator.notEmpty().withMessage(`${label} is required`);
};

/**
 * @param {string} field
 * @param {boolean} optional
 * @returns {any}
 */
export const quantityValidation = (field = "quantity", optional = false) => {
  const validator = body(field).isInt({ min: 1 }).withMessage(`${field} must be at least 1`);
  return optional ? validator.optional() : validator.notEmpty().withMessage(`${field} is required`);
};

/**
 * @param {string} field
 * @returns {any}
 */
export const booleanValidation = (field) =>
  body(field).optional().isBoolean().withMessage(`${field} must be a boolean`);

/**
 * @param {boolean} optional
 * @returns {any}
 */
export const ratingValidation = (optional = false) => {
  const validator = body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be a number between 1 and 5");

  return optional ? validator.optional() : validator.notEmpty().withMessage("Rating is required");
};

/**
 * @param {string} field
 * @param {number} maxLength
 * @returns {any}
 */
export const commentValidation = (field = "comment", maxLength = 500) =>
  body(field)
    .optional()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`${field} must be between 1 and ${maxLength} characters`)
    .trim()
    .escape();

/**
 * @param {number} maxLength
 * @returns {any}
 */
export const messageValidation = (maxLength = 500) =>
  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .trim()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`Message must be between 1 and ${maxLength} characters`)
    .escape();

/**
 * @returns {any}
 */
export const stockValidation = () =>
  body("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer");

/**
 * @param {boolean} optional
 * @returns {any}
 */
export const orderStatusValidation = (optional = false) => {
  const validator = body("status")
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid status value");

  return optional ? validator.optional() : validator.notEmpty().withMessage("Status is required");
};

/**
 * @param {boolean} optional
 * @returns {any}
 */
export const paymentStatusValidation = (optional = false) => {
  const validator = body("paymentStatus")
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Invalid payment status value");

  return optional
    ? validator.optional()
    : validator.notEmpty().withMessage("Payment status is required");
};

/**
 * @returns {any}
 */
export const shippingCostValidation = () =>
  body("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a positive number");

/**
 * @returns {any}
 */
export const cardNumberValidation = () =>
  body("cardNumber")
    .optional()
    .matches(/^\d{16}$/)
    .withMessage("Card number must be 16 digits");

/**
 * @returns {any}
 */
export const expiryDateValidation = () =>
  body("expiryDate")
    .optional()
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/)
    .withMessage("Expiry date must be in MM/YY format");

/**
 * @returns {any}
 */
export const paymentTypeValidation = () =>
  body("type")
    .notEmpty()
    .withMessage("Payment type is required")
    .isIn(["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"])
    .withMessage("Invalid payment method type");

/**
 * @returns {any}
 */
export const roleValidation = () =>
  body("role")
    .optional()
    .isIn(["admin", "customer", "guest"])
    .withMessage("Role must be admin, customer, or guest");

/**
 * @param {string} field
 * @returns {any}
 */
export const nameValidation = (field = "name") =>
  body(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .isLength({ min: 2, max: 100 })
    .withMessage(`${field} must be between 2 and 100 characters`)
    .trim()
    .escape();

/**
 * @returns {any}
 */
export const addressLineValidation = () =>
  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters")
    .trim()
    .escape();

/**
 * @returns {any}
 */
export const cityValidation = () =>
  body("city")
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("City must contain only letters and spaces")
    .trim()
    .escape();

/**
 * @returns {any}
 */
export const stateValidation = () =>
  body("state")
    .notEmpty()
    .withMessage("State is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("State must contain only letters and spaces")
    .trim()
    .escape();

/**
 * @returns {any}
 */
export const postalCodeValidation = () =>
  body("postalCode")
    .notEmpty()
    .withMessage("Postal code is required")
    .isLength({ min: 4, max: 6 })
    .withMessage("Postal code must be between 4 and 6 characters")
    .isNumeric()
    .withMessage("Postal code must contain only numbers")
    .trim();

/**
 * @returns {any}
 */
export const countryValidation = () =>
  body("country")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Country must contain only letters and spaces")
    .trim()
    .escape();

/**
 * @returns {any}
 */
export const addressTypeValidation = () =>
  body("addressType")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("Address type must be home, work, or other");

/**
 * @returns {any}
 */
export const addressPhoneValidation = () =>
  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone must be between 10 and 15 characters")
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Phone must contain only numbers, spaces, parentheses, plus and dash")
    .trim();

/**
 * @returns {any}
 */
export const queryEmailValidation = () =>
  query("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail();

/**
 * @returns {any}
 */
export const passwordLoginValidation = () =>
  body("password").notEmpty().withMessage("Password is required");

/**
 * @param {string} field
 * @param {number} minLength
 * @param {number} maxLength
 * @returns {any}
 */
export const searchQueryValidation = (field = "q", minLength = 1, maxLength = 100) =>
  query(field)
    .optional()
    .trim()
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`Search query must be between ${minLength} and ${maxLength} characters`);

/**
 * @param {string[]} allowedFields
 * @returns {any}
 */
export const sortFieldValidation = (allowedFields = []) =>
  query("sort")
    .optional()
    .isIn(allowedFields)
    .withMessage(`Sort must be one of: ${allowedFields.join(", ")}`);

/**
 * @returns {any}
 */
export const orderValidation = () =>
  query("order").optional().isIn(["asc", "desc"]).withMessage("Order must be asc or desc");

/**
 * @param {string} field
 * @param {boolean} required
 * @param {number} maxLength
 * @returns {any}
 */
export const generalNameValidation = (field = "name", required = true, maxLength = 100) => {
  const validator = body(field)
    .trim()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`${field} must be between 1 and ${maxLength} characters`);

  return required ? validator.notEmpty().withMessage(`${field} is required`) : validator.optional();
};

/**
 * @param {string} field
 * @param {string} label
 * @returns {any}
 */
export const queryMongoIdValidation = (field, label) =>
  query(field).optional().isMongoId().withMessage(`Invalid ${label} format`);

/**
 * @returns {any}
 */
export const cardHolderNameValidation = () =>
  body("cardHolderName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Card holder name cannot be empty")
    .escape();

/**
 * @returns {any}
 */
export const paypalEmailValidation = () =>
  body("paypalEmail").optional().isEmail().withMessage("Invalid PayPal email format");

/**
 * @returns {any}
 */
export const bankNameValidation = () =>
  body("bankName").optional().trim().notEmpty().withMessage("Bank name cannot be empty").escape();

/**
 * @returns {any}
 */
export const accountNumberValidation = () =>
  body("accountNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Account number cannot be empty")
    .escape();

/**
 * @param {string} field
 * @returns {any}
 */
export const queryPriceValidation = (field) =>
  query(field).optional().isFloat({ min: 0 }).withMessage(`${field} must be a positive number`);

/**
 * @param {string} field
 * @returns {any}
 */
export const queryBooleanValidation = (field) =>
  query(field).optional().isIn(["true", "false"]).withMessage(`${field} must be true or false`);

/**
 * @returns {any}
 */
export const stockOptionalValidation = () =>
  body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer");

/**
 * @param {boolean} required
 * @returns {any[]}
 */
export const imagesUrlValidation = (required = true) => {
  const validators = [
    body("imagesUrl").isArray({ min: 1 }).withMessage("At least one image URL is required"),
    body("imagesUrl.*").isURL().withMessage("Each image must be a valid URL"),
  ];

  if (required) {
    validators[0] = body("imagesUrl")
      .notEmpty()
      .withMessage("Images URL is required")
      .isArray({ min: 1 })
      .withMessage("At least one image URL is required");
  } else {
    validators[0] = body("imagesUrl")
      .optional()
      .isArray({ min: 1 })
      .withMessage("At least one image URL is required");
    validators[1] = body("imagesUrl.*")
      .optional()
      .isURL()
      .withMessage("Each image must be a valid URL");
  }

  return validators;
};

/**
 * @param {boolean} required
 * @returns {any}
 */
export const productNameValidation = (required = true) => {
  const validator = body("name")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .trim();

  return required ? validator.notEmpty().withMessage("Name is required") : validator.optional();
};

/**
 * @param {boolean} required
 * @returns {any}
 */
export const productDescriptionValidation = (required = true) => {
  const validator = body("description")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters")
    .trim();

  return required
    ? validator.notEmpty().withMessage("Description is required")
    : validator.optional();
};

/**
 * @returns {any}
 */
export const nameOptionalValidation = () =>
  body("name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .trim()
    .escape();

/**
 * @returns {any}
 */
export const addressLineOptionalValidation = () =>
  body("address")
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters")
    .trim()
    .escape();

/**
 * @returns {any}
 */
export const cityOptionalValidation = () =>
  body("city")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("City must contain only letters and spaces")
    .trim()
    .escape();

/**
 * @returns {any}
 */
export const stateOptionalValidation = () =>
  body("state")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("State must contain only letters and spaces")
    .trim()
    .escape();

/**
 * @returns {any}
 */
export const postalCodeOptionalValidation = () =>
  body("postalCode")
    .optional()
    .isLength({ min: 4, max: 6 })
    .withMessage("Postal code must be between 4 and 6 characters")
    .isNumeric()
    .withMessage("Postal code must contain only numbers")
    .trim();

/**
 * @returns {any}
 */
export const addressPhoneOptionalValidation = () =>
  body("phone")
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone must be between 10 and 15 characters")
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Phone must contain only numbers, spaces, parentheses, plus and dash")
    .trim();

/**
 * @param {boolean} required
 * @returns {any}
 */
export const userDisplayNameValidation = (required = true) => {
  const validator = body("displayName")
    .isLength({ min: 2, max: 50 })
    .withMessage("Display name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Display name must contain only letters, numbers and spaces")
    .trim()
    .escape();

  return required
    ? validator.notEmpty().withMessage("Display name is required")
    : validator.optional();
};

/**
 * @param {boolean} required
 * @returns {any}
 */
export const fullPasswordValidation = (required = true) => {
  const validator = body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain at least one letter");

  return required ? validator.notEmpty().withMessage("Password is required") : validator.optional();
};

/**
 * @returns {any}
 */
export const newPasswordValidation = () =>
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("New password must contain at least one number")
    .matches(/[a-zA-Z]/)
    .withMessage("New password must contain at least one letter");

/**
 * @returns {any}
 */
export const confirmPasswordValidation = () =>
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Password confirmation does not match new password");
    }
    return true;
  });

/**
 * @returns {any}
 */
export const queryRoleValidation = () =>
  query("role")
    .optional()
    .isIn(["admin", "customer", "guest"])
    .withMessage("Role must be admin, customer, or guest");

/**
 * @returns {any}
 */
export const queryIsActiveValidation = () =>
  query("isActive")
    .optional()
    .isIn(["true", "false"])
    .withMessage("isActive must be true or false");
