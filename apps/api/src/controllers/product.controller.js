const Product = require("../models/product.model");
const Category = require("../models/category.model");
const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/app-error");
const {
  uploadBufferToCloudinary,
  destroyCloudinaryImage
} = require("../services/image-upload.service");

const publicCategoryFilter = {
  isActive: true,
  isFrozen: false,
  isDeleted: false
};

// ============================
// 📦 PUBLIC
// ============================

// GET /products
const getPublicProducts = async (req, res, next) => {
  try {
    const query = {
      isActive: true,
      isFrozen: false,
      isDeleted: false
    };

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } }
      ];
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "category",
        select: "name slug isActive isFrozen isDeleted",
        match: publicCategoryFilter
      });

   
    const visibleProducts = products.filter((p) => p.category);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: { products: visibleProducts }
    });
  } catch (error) {
    return next(error);
  }
};

// GET /products/:id
const getPublicProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
      isFrozen: false,
      isDeleted: false
    }).populate({
      path: "category",
      select: "name slug isActive isFrozen isDeleted",
      match: publicCategoryFilter
    });

    if (!product || !product.category) {
      throw new AppError("Product not found", StatusCodes.NOT_FOUND);
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: { product }
    });
  } catch (error) {
    return next(error);
  }
};

// ============================
//  ADMIN
// ============================

// GET /products/admin/all
const getAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate("category", "name slug isActive isFrozen isDeleted");

    return res.status(StatusCodes.OK).json({
      success: true,
      data: { products }
    });
  } catch (error) {
    return next(error);
  }
};

// POST /products
const createProduct = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("Product image is required", StatusCodes.BAD_REQUEST);
    }

    const category = await Category.findOne({
      _id: req.body.category,
      isActive: true,
      isFrozen: false,
      isDeleted: false
    });

    if (!category) {
      throw new AppError("Invalid category", StatusCodes.NOT_FOUND);
    }

    const folder = process.env.CLOUDINARY_FOLDER || "veg-store";

    const uploadResult = await uploadBufferToCloudinary(
      req.file.buffer,
      folder
    );

    try {
      const product = await Product.create({
        ...req.body,
        imageUrl: uploadResult.secure_url,
        imagePublicId: uploadResult.public_id
      });

      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Product created successfully",
        data: { product }
      });
    } catch (error) {
      // ❗ אם DB נכשל → מוחקים תמונה
      await destroyCloudinaryImage(uploadResult.public_id);
      throw error;
    }
  } catch (error) {
    return next(error);
  }
};

// PATCH /products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!product) {
      throw new AppError("Product not found", StatusCodes.NOT_FOUND);
    }

    if (req.body.category) {
      const category = await Category.findOne({
        _id: req.body.category,
        isActive: true,
        isFrozen: false,
        isDeleted: false
      });

      if (!category) {
        throw new AppError("Invalid category", StatusCodes.NOT_FOUND);
      }
    }

    const previousImagePublicId = product.imagePublicId;
    let nextImagePublicId = previousImagePublicId;
    let nextImageUrl = product.imageUrl;

    if (req.file) {
      const folder = process.env.CLOUDINARY_FOLDER || "veg-store";

      const uploadResult = await uploadBufferToCloudinary(
        req.file.buffer,
        folder
      );

      nextImagePublicId = uploadResult.public_id;
      nextImageUrl = uploadResult.secure_url;
    }

    Object.assign(product, {
      ...req.body,
      imageUrl: nextImageUrl,
      imagePublicId: nextImagePublicId
    });

    try {
      await product.save();
    } catch (error) {
      // ❗ אם שמירה נכשלת → מוחקים תמונה חדשה
      if (req.file && nextImagePublicId !== previousImagePublicId) {
        await destroyCloudinaryImage(nextImagePublicId);
      }
      throw error;
    }

    // ❗ מוחקים תמונה ישנה אם הוחלפה
    if (req.file && previousImagePublicId !== nextImagePublicId) {
      await destroyCloudinaryImage(previousImagePublicId);
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Product updated successfully",
      data: { product }
    });
  } catch (error) {
    return next(error);
  }
};

// PATCH /products/:id/freeze
const freezeProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!product) {
      throw new AppError("Product not found", StatusCodes.NOT_FOUND);
    }

    product.isFrozen = req.body.isFrozen;

    await product.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Product freeze status updated",
      data: { product }
    });
  } catch (error) {
    return next(error);
  }
};

// DELETE /products/:id
const softDeleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!product) {
      throw new AppError("Product not found", StatusCodes.NOT_FOUND);
    }

    product.isActive = false;
    product.isFrozen = true;
    product.isDeleted = true;

    await product.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Product deleted successfully",
      data: { product }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPublicProducts,
  getPublicProductById,
  getAdminProducts,
  createProduct,
  updateProduct,
  freezeProduct,
  softDeleteProduct
};