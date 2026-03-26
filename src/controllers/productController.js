// @ts-check
import Product from "../models/product.js";
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function getProducts(req, res, next) {
  try {
    // @ts-ignore
    const page = parseInt(String(req.query.page || 1));
    // @ts-ignore
    const limit = parseInt(String(req.query.limit || 10));
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .populate("category")
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    const totalResults = await Product.countDocuments();
    const totalPages = Math.ceil(totalResults / limit);
    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function getBestSellers(req, res, next) {
  try {
    const query = /** @type {any} */ (req.query);
    const limit = parseInt(query.limit) || 12;
    const products = await Product.find()
      .populate("category")
      .sort({ soldCount: -1, name: 1 })
      .limit(limit);

    res.json(products);
  } catch (error) {
    next(error);
  }
}
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function getProductById(req, res, next) {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).populate("category");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
}
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function getProductByCategory(req, res, next) {
  try {
    const id = req.params.idCategory;
    const products = await Product.find({ category: id }).populate("category").sort({ name: 1 });
    if (products.length === 0) {
      return res.status(404).json({ message: "No products found on this category" });
    }
    res.json(products);
  } catch (error) {
    next(error);
  }
}
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function createProduct(req, res, next) {
  try {
    let { name, description, price, stock, imagesUrl, category } = /** @type {any} */ (req.body);
 
    const files = /** @type {any} */ (req.files);
    // Support Multer Cloudinary Uploads
    if (files && files.length > 0) {
      const uploadedUrls = files.map((/** @type {any} */ file) => file.path);
      // Append or replace depending on what was sent
      if (typeof imagesUrl === 'string') imagesUrl = [imagesUrl, ...uploadedUrls];
      else if (Array.isArray(imagesUrl)) imagesUrl = [...imagesUrl, ...uploadedUrls];
      else imagesUrl = uploadedUrls;
    }
    const newProduct = await Product.create({
      name,
      description,
      price,
      stock,
      imagesUrl,
      category,
    });

    const populatedProduct = await Product.findById(newProduct._id).populate("category");

    res.status(201).json(populatedProduct);
  }
  catch (error) {
    next(error);
  }
}
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function updateProduct(req, res, next) {
  try {
    const params = /** @type {any} */ (req.params);
    const body = /** @type {any} */ (req.body);
    const files = /** @type {any} */ (req.files);

    const id = params.id;
    let { name, description, price, stock, imagesUrl, category } = body;

    // Support Multer Cloudinary Uploads
    if (files && files.length > 0) {
      const uploadedUrls = files.map((/** @type {any} */ file) => file.path);
      if (typeof imagesUrl === 'string') imagesUrl = [imagesUrl, ...uploadedUrls];
      else if (Array.isArray(imagesUrl)) imagesUrl = Array.isArray(imagesUrl) ? [...imagesUrl, ...uploadedUrls] : uploadedUrls;
      else imagesUrl = uploadedUrls;
    }
    // Validar que al menos un campo esté presente
    if (
      !name &&
      !description &&
      price === undefined &&
      stock === undefined &&
      !imagesUrl &&
      !category
    ) {
      return res.status(400).json({
        message: "At least one field must be provided to update",
      });
    }
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    // Actualizar solo los campos proporcionados
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (imagesUrl !== undefined) product.imagesUrl = imagesUrl;
    if (category !== undefined) product.category = category;

    await product.save();

    const updatedProduct = await Product.findById(id).populate("category");

    res.status(200).json(updatedProduct);
  }
  catch (error) {
    next(error);
  }
}
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function deleteProduct(req, res, next) {
  try {
    const id = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(204).send();
  }
  catch (error) {
    next(error);
  }
}
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function searchProducts(req, res, next) {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort,
      order,
      page = 1,
      limit = 10,
    } = req.query;

    let filters = /** @type {any} */ ({});
 
    if (q) {
      // Blindaje contra ReDoS: Limitar longitud y escapar caracteres especiales
      const sanitizedQ = String(q).substring(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filters.$or = [
        { name: { $regex: sanitizedQ, $options: "i" } },
        { description: { $regex: sanitizedQ, $options: "i" } },
      ];
    }

    if (category) {
      filters.category = category;
    }

    if (minPrice || maxPrice) {
      filters.price = {};
      // @ts-ignore
      if (minPrice) filters.price.$gte = parseFloat(String(minPrice));
      // @ts-ignore
      if (maxPrice) filters.price.$lte = parseFloat(String(maxPrice));
    }

    if (inStock === "true") {
      filters.stock = { $gt: 0 };
    }

    let sortOptions = {};

    if (sort) {
      const sortOrder = order === "desc" ? -1 : 1;
      filters[String(sort)] = sortOrder;
    } else {
      // @ts-ignore
      filters.name = 1;
    }

    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

    // @ts-ignore
    const products = await Product.find(filters)
      .populate("category")
      // @ts-ignore
      .sort(filters)
      .skip(skip)
      // @ts-ignore
      .limit(limit);

    const totalResults = await Product.countDocuments(filters);
    // @ts-ignore
    const totalPages = Math.ceil(totalResults / parseInt(String(limit)));

    res.status(200).json({
      products,
      pagination: {
        // @ts-ignore
        currentPage: parseInt(String(page)),
        totalPages,
        totalResults,
        // @ts-ignore
        hasNext: parseInt(String(page)) < totalPages,
        // @ts-ignore
        hasPrev: parseInt(String(page)) > 1,
      },
    });
  }
  catch (error) {
    next(error);
  }
}

export {
  createProduct,
  deleteProduct,
  getBestSellers,
  getProductByCategory,
  getProductById,
  getProducts,
  searchProducts,
  updateProduct,
};