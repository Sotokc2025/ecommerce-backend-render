import { body, param, query } from "express-validator";

export const emailValidation = (optional = false) => {
  const validator = body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail()
    .trim();

  return optional ? validator.optional() : validator.notEmpty().withMessage("Email is required");
};

export const passwordValidation = () =>
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain at least one letter");

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

export const phoneValidation = () =>
  body("phone")
    .optional()
    .isLength({ min: 10, max: 10 })
    .withMessage("Phone must be exactly 10 digits")
    .matches(/^[0-9]+$/)
    .withMessage("Phone must contain only numbers");

export const mongoIdValidation = (field = "id", customLabel = null) => {
  const label = customLabel || field;
  return param(field).isMongoId().withMessage(`${label} must be a valid MongoDB ObjectId`);
};

export const paginationValidation = () => [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

export const priceValidation = (field = "price") =>
  body(field).isFloat({ min: 0 }).withMessage(`${field} must be a positive number`);

export const priceOptionalValidation = (field = "price") =>
  body(field)
    .optional()
    .isFloat({ min: 0 })
    .withMessage(`${field} must be a positive number`);

export const descriptionValidation = (field = "description") =>
  body(field)
    .optional()
    .isLength({ max: 2000 })
    .withMessage(`${field} must not exceed 2000 characters`)
    .trim()
    .escape();

export const urlValidation = (field = "url") =>
  body(field).optional().isURL().withMessage(`${field} must be a valid URL`);

// Validación de MongoID en body (no en param)
export const bodyMongoIdValidation = (field, label, optional = false) => {
  const validator = body(field).isMongoId().withMessage(`Invalid ${label} format`);

  return optional ? validator.optional() : validator.notEmpty().withMessage(`${label} is required`);
};

// Validación de cantidad
export const quantityValidation = (field = "quantity", optional = false) => {
  const validator = body(field).isInt({ min: 1 }).withMessage(`${field} must be at least 1`);

  return optional ? validator.optional() : validator.notEmpty().withMessage(`${field} is required`);
};

// Validación de boolean
export const booleanValidation = (field) =>
  body(field).optional().isBoolean().withMessage(`${field} must be a boolean`);

// Validación de rating
export const ratingValidation = (optional = false) => {
  const validator = body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be a number between 1 and 5");

  return optional ? validator.optional() : validator.notEmpty().withMessage("Rating is required");
};

// Validación de comentarios
export const commentValidation = (field = "comment", maxLength = 500) =>
  body(field)
    .optional()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`${field} must be between 1 and ${maxLength} characters`)
    .trim()
    .escape();

// Validación de mensaje
export const messageValidation = (maxLength = 500) =>
  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .trim()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`Message must be between 1 and ${maxLength} characters`)
    .escape();

// Validación de stock
export const stockValidation = () =>
  body("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer");

// Validación de order status
export const orderStatusValidation = (optional = false) => {
  const validator = body("status")
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid status value");

  return optional ? validator.optional() : validator.notEmpty().withMessage("Status is required");
};

// Validación de payment status
export const paymentStatusValidation = (optional = false) => {
  const validator = body("paymentStatus")
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Invalid payment status value");

  return optional
    ? validator.optional()
    : validator.notEmpty().withMessage("Payment status is required");
};

// Validación de shipping cost
export const shippingCostValidation = () =>
  body("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a positive number");

// Validación de card number
export const cardNumberValidation = () =>
  body("cardNumber")
    .optional()
    .matches(/^\d{16}$/)
    .withMessage("Card number must be 16 digits");

// Validación de expiry date
export const expiryDateValidation = () =>
  body("expiryDate")
    .optional()
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/)
    .withMessage("Expiry date must be in MM/YY format");

// Validación de payment type
export const paymentTypeValidation = () =>
  body("type")
    .notEmpty()
    .withMessage("Payment type is required")
    .isIn(["credit_card", "debit_card", "paypal", "bank_transfer", "cash_on_delivery"])
    .withMessage("Invalid payment method type");

// Validación de role
export const roleValidation = () =>
  body("role")
    .optional()
    .isIn(["admin", "customer", "guest"])
    .withMessage("Role must be admin, customer, or guest");

// Validaciones de dirección
export const nameValidation = (field = "name") =>
  body(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .isLength({ min: 2, max: 100 })
    .withMessage(`${field} must be between 2 and 100 characters`)
    .trim()
    .escape();

export const addressLineValidation = () =>
  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters")
    .trim()
    .escape();

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

export const postalCodeValidation = () =>
  body("postalCode")
    .notEmpty()
    .withMessage("Postal code is required")
    .isLength({ min: 4, max: 6 })
    .withMessage("Postal code must be between 4 and 6 characters")
    .isNumeric()
    .withMessage("Postal code must contain only numbers")
    .trim();

export const countryValidation = () =>
  body("country")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Country must contain only letters and spaces")
    .trim()
    .escape();

export const addressTypeValidation = () =>
  body("addressType")
    .optional()
    .isIn(["home", "work", "other"])
    .withMessage("Address type must be home, work, or other");

// Validación de phone para direcciones (más flexible que la de usuario)
export const addressPhoneValidation = () =>
  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone must be between 10 and 15 characters")
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Phone must contain only numbers, spaces, parentheses, plus and dash")
    .trim();

// Validación de email en query (para check-email, búsquedas, etc.)
export const queryEmailValidation = () =>
  query("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail();

// Validación de password para login (solo verifica que no esté vacío)
export const passwordLoginValidation = () =>
  body("password").notEmpty().withMessage("Password is required");

// Validación de query de búsqueda
export const searchQueryValidation = (field = "q", minLength = 1, maxLength = 100) =>
  query(field)
    .optional()
    .trim()
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`Search query must be between ${minLength} and ${maxLength} characters`);

// Validación de sort field
export const sortFieldValidation = (allowedFields = []) =>
  query("sort")
    .optional()
    .isIn(allowedFields)
    .withMessage(`Sort must be one of: ${allowedFields.join(", ")}`);

// Validación de order (asc/desc)
export const orderValidation = () =>
  query("order").optional().isIn(["asc", "desc"]).withMessage("Order must be asc or desc");

// Validación de nombre general
export const generalNameValidation = (field = "name", required = true, maxLength = 100) => {
  const validator = body(field)
    .trim()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`${field} must be between 1 and ${maxLength} characters`);

  return required ? validator.notEmpty().withMessage(`${field} is required`) : validator.optional();
};

// Validación de MongoID en query
export const queryMongoIdValidation = (field, label) =>
  query(field).optional().isMongoId().withMessage(`Invalid ${label} format`);

// Validación de card holder name
export const cardHolderNameValidation = () =>
  body("cardHolderName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Card holder name cannot be empty")
    .escape();

// Validación de PayPal email
export const paypalEmailValidation = () =>
  body("paypalEmail").optional().isEmail().withMessage("Invalid PayPal email format");

// Validación de bank name
export const bankNameValidation = () =>
  body("bankName").optional().trim().notEmpty().withMessage("Bank name cannot be empty").escape();

// Validación de account number
export const accountNumberValidation = () =>
  body("accountNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Account number cannot be empty")
    .escape();

// Validación de precio en query (minPrice, maxPrice)
export const queryPriceValidation = (field) =>
  query(field).optional().isFloat({ min: 0 }).withMessage(`${field} must be a positive number`);

// Validación de boolean en query (inStock, etc.)
export const queryBooleanValidation = (field) =>
  query(field).optional().isIn(["true", "false"]).withMessage(`${field} must be true or false`);

// Validación de stock opcional
export const stockOptionalValidation = () =>
  body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer");

// Validación de array de URLs de imágenes
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

// Validación de nombre de producto
export const productNameValidation = (required = true) => {
  const validator = body("name")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .trim();

  return required ? validator.notEmpty().withMessage("Name is required") : validator.optional();
};

// Validación de descripción de producto
export const productDescriptionValidation = (required = true) => {
  const validator = body("description")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters")
    .trim();

  return required
    ? validator.notEmpty().withMessage("Description is required")
    : validator.optional();
};

// Validaciones opcionales de dirección
export const nameOptionalValidation = () =>
  body("name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .trim()
    .escape();

export const addressLineOptionalValidation = () =>
  body("address")
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters")
    .trim()
    .escape();

export const cityOptionalValidation = () =>
  body("city")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("City must contain only letters and spaces")
    .trim()
    .escape();

export const stateOptionalValidation = () =>
  body("state")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("State must contain only letters and spaces")
    .trim()
    .escape();

export const postalCodeOptionalValidation = () =>
  body("postalCode")
    .optional()
    .isLength({ min: 4, max: 6 })
    .withMessage("Postal code must be between 4 and 6 characters")
    .isNumeric()
    .withMessage("Postal code must contain only numbers")
    .trim();

export const addressPhoneOptionalValidation = () =>
  body("phone")
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone must be between 10 and 15 characters")
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Phone must contain only numbers, spaces, parentheses, plus and dash")
    .trim();

// Validación de displayName con caracteres especiales permitidos
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

// Validación de contraseña completa con número y letra requeridos
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

// Validación de nueva contraseña
export const newPasswordValidation = () =>
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("New password must contain at least one number")
    .matches(/[a-zA-Z]/)
    .withMessage("New password must contain at least one letter");

// Validación de confirmación de contraseña
export const confirmPasswordValidation = () =>
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Password confirmation does not match new password");
    }
    return true;
  });

// Validación de role en query
export const queryRoleValidation = () =>
  query("role")
    .optional()
    .isIn(["admin", "customer", "guest"])
    .withMessage("Role must be admin, customer, or guest");

// Validación de isActive en query
export const queryIsActiveValidation = () =>
  query("isActive")
    .optional()
    .isIn(["true", "false"])
    .withMessage("isActive must be true or false");
