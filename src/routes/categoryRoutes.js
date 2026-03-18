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
router.get("/categories", getCategories);
router.get("/categories/:id", [mongoIdValidation("id", "Category ID")], validate, getCategoryById);
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
router.delete(
  "/categories/:id",
  authMiddleware,
  isAdmin,
  [mongoIdValidation("id", "Category ID")],
  validate,
  deleteCategory
);

export default router;
