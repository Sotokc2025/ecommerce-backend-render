import Product from "../models/product.js";

async function getProducts(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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

async function getBestSellers(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const products = await Product.find()
      .populate("category")
      .sort({ soldCount: -1, name: 1 })
      .limit(limit);

    res.json(products);
  } catch (error) {
    next(error);
  }
}

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

async function createProduct(req, res, next) {
  try {
    let { name, description, price, stock, imagesUrl, category } = req.body;

    // Support Multer Cloudinary Uploads
    if (req.files && req.files.length > 0) {
      const uploadedUrls = req.files.map(file => file.path);
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
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const id = req.params.id;
    let { name, description, price, stock, imagesUrl, category } = req.body;

    // Support Multer Cloudinary Uploads
    if (req.files && req.files.length > 0) {
      const uploadedUrls = req.files.map(file => file.path);
      if (typeof imagesUrl === 'string') imagesUrl = [imagesUrl, ...uploadedUrls];
      else if (Array.isArray(imagesUrl)) imagesUrl = [...imagesUrl, ...uploadedUrls];
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
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const id = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

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

    let filters = {};

    if (q) {
      filters.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (category) {
      filters.category = category;
    }

    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = parseFloat(minPrice);
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
    }

    if (inStock === "true") {
      filters.stock = { $gt: 0 };
    }

    let sortOptions = {};

    if (sort) {
      const sortOrder = order === "desc" ? -1 : 1;
      sortOptions[sort] = sortOrder;
    } else {
      sortOptions.name = 1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filters)
      .populate("category")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const totalResults = await Product.countDocuments(filters);
    const totalPages = Math.ceil(totalResults / parseInt(limit));

    res.status(200).json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
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
