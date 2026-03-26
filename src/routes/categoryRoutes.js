// @ts-check
import express from "express";
import { body, param, query } from "express-validator";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  searchCategory,
  updateCategory,
} from "../controllers/categoryController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import validate from "../middlewares/validation.js";
import {
  mongoIdValidation,
  paginationValidation,
  descriptionValidation,
  urlValidation,
  searchQueryValidation,
  sortFieldValidation,
  orderValidation,
  generalNameValidation,
  queryMongoIdValidation,
  bodyMongoIdValidation,
} from "../middlewares/validators.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Endpoints for managing product categories
 */

/**
 * @swagger
 * /categories/search:
 *   get:
 *     summary: Busca categorías por criterios
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Resultados de la búsqueda
 */
router.get(
  "/categories/search",
  [
    searchQueryValidation(),
    queryMongoIdValidation("parentCategory", "parent category ID"),
    sortFieldValidation(["name", "description", "createdAt", "updatedAt"]),
    orderValidation(),
    ...paginationValidation(),
  ],
  validate,
  searchCategory
);
/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Obtiene todas las categorías principal/jerárquicas
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
router.get("/categories", getCategories);
/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Obtiene una categoría por ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la categoría
 */
router.get("/categories/:id", [mongoIdValidation("id", "Category ID")], validate, getCategoryById);
/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Crea una nueva categoría (admin)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parentCategory:
 *                 type: string
 *               imageURL:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoría creada existosamente
 */
router.post(
  "/categories",
  authMiddleware,
  isAdmin,
  [
    generalNameValidation("name", true, 100),
    descriptionValidation("description"),
    bodyMongoIdValidation("parentCategory", "Parent category", true),
    urlValidation("imageURL"),
  ],
  validate,
  createCategory
);
/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Actualiza una categoría existente (admin)
 *     tags: [Categories]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parentCategory:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoría actualizada
 */
router.put(
  "/categories/:id",
  authMiddleware,
  isAdmin,
  [
    mongoIdValidation("id", "Category ID"),
    generalNameValidation("name", false, 100),
    descriptionValidation("description"),
    bodyMongoIdValidation("parentCategory", "Parent category", true),
    urlValidation("imageURL"),
  ],
  validate,
  updateCategory
);
/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Elimina una categoría (admin)
 *     tags: [Categories]
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
 *         description: Categoría eliminada
 */
router.delete(
  "/categories/:id",
  authMiddleware,
  isAdmin,
  [mongoIdValidation("id", "Category ID")],
  validate,
  deleteCategory
);

export default router;
