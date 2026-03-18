import express from "express";
import {
    createProduct,
    deleteProduct,
    getBestSellers,
    getProductByCategory,
    getProductById,
    getProducts,
    searchProducts,
    updateProduct,
} from "../controllers/productController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import validate from "../middlewares/validation.js";
import {
    bodyMongoIdValidation,
    imagesUrlValidation,
    mongoIdValidation,
    orderValidation,
    paginationValidation,
    priceOptionalValidation,
    priceValidation,
    productDescriptionValidation,
    productNameValidation,
    queryBooleanValidation,
    queryMongoIdValidation,
    queryPriceValidation,
    searchQueryValidation,
    sortFieldValidation,
    stockOptionalValidation,
    stockValidation
} from "../middlewares/validators.js";

const router = express.Router();

// Obtener todos los productos con paginación
router.get("/products", [...paginationValidation()], validate, getProducts);
// Buscar productos con filtros
router.get(
  "/products/search",
  [
    searchQueryValidation(),
    queryMongoIdValidation("category", "Category"),
    queryPriceValidation("minPrice"),
    queryPriceValidation("maxPrice"),
    queryBooleanValidation("inStock"),
    sortFieldValidation(["name", "price", "createdAt"]),
    orderValidation(),
    ...paginationValidation(),
  ],
  validate,
  searchProducts
);
// Obtener productos por categoría
router.get(
  "/products/category/:idCategory",
  [mongoIdValidation("idCategory", "Category ID")],
  validate,
  getProductByCategory
);
// Obtener los productos más vendidos
router.get("/products/bestsellers", getBestSellers);
// Obtener producto por ID
router.get("/products/:id", [mongoIdValidation("id", "Product ID")], validate, getProductById);
// Crear producto (solo admin)
router.post(
  "/products",
  authMiddleware,
  isAdmin,
  [
    productNameValidation(true),
    productDescriptionValidation(true),
    priceValidation("price"),
    stockValidation(),
    ...imagesUrlValidation(true),
    bodyMongoIdValidation("category", "Category"),
  ],
  validate,
  createProduct
);
// Actualizar producto (solo admin)
router.put(
  "/products/:id",
  authMiddleware,
  isAdmin,
  [
    mongoIdValidation("id", "Product ID"),
    productNameValidation(false),
    productDescriptionValidation(false),
    priceOptionalValidation("price"),
    stockOptionalValidation(),
    ...imagesUrlValidation(false),
    bodyMongoIdValidation("category", "Category", true),
  ],
  validate,
  updateProduct
);
// Eliminar producto (solo admin)
router.delete(
  "/products/:id",
  authMiddleware,
  isAdmin,
  [mongoIdValidation("id", "Product ID")],
  validate,
  deleteProduct
);

export default router;
