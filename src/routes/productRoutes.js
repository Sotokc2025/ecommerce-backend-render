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
import upload from "../middlewares/upload.js";
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
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Obtiene todos los productos con paginación
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de productos
 */
router.get("/products", [...paginationValidation()], validate, getProducts);
// Buscar productos con filtros
/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Busca productos con filtros avanzados
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 */
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
/**
 * @swagger
 * /products/category/{idCategory}:
 *   get:
 *     summary: Obtiene productos por ID de categoría
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: idCategory
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de productos de la categoría
 */
router.get(
  "/products/category/:idCategory",
  [mongoIdValidation("idCategory", "Category ID")],
  validate,
  getProductByCategory
);
// Obtener los productos más vendidos
/**
 * @swagger
 * /products/bestsellers:
 *   get:
 *     summary: Obtiene los productos más vendidos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de bestsellers
 */
router.get("/products/bestsellers", getBestSellers);
// Obtener producto por ID
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtiene un producto por su ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del producto
 *       404:
 *         description: Producto no encontrado
 */
router.get("/products/:id", [mongoIdValidation("id", "Product ID")], validate, getProductById);
// Crear producto (solo admin)
router.post(
  "/products",
  authMiddleware,
  isAdmin,
  upload.array("images", 5),
  [
    productNameValidation(true),
    productDescriptionValidation(true),
    priceValidation("price"),
    stockValidation(),
    ...imagesUrlValidation(false), // Opcional porque ahora viene de multer en req.files
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
  upload.array("images", 5),
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
