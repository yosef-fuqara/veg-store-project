const { StatusCodes } = require("http-status-codes");
const Category = require("../models/category.model");
const AppError = require("../utils/app-error");

const normalizeName = (value) => value.trim().replace(/\s+/g, " ");
const toSlug = (value) =>
  normalizeName(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05ff\s-]/g, "")
    .replace(/\s+/g, "-");

const getPublicCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true, isFrozen: false, isDeleted: false })
      .sort({ name: 1 })
      .select("name slug description isFrozen isActive createdAt updatedAt");

    return res.status(StatusCodes.OK).json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({})
      .sort({ createdAt: -1 })
      .select("name slug description isFrozen isActive isDeleted createdAt updatedAt");
    return res.status(StatusCodes.OK).json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    return next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const normalizedName = normalizeName(req.body.name);
    const slug = toSlug(normalizedName);
    const existing = await Category.findOne({ slug, isDeleted: false });
    if (existing) {
      throw new AppError("Category name already exists", StatusCodes.CONFLICT);
    }

    const category = await Category.create({
      name: normalizedName,
      slug,
      description: req.body.description || ""
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Category created successfully",
      data: { category }
    });
  } catch (error) {
    return next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!category) {
      throw new AppError("Category not found", StatusCodes.NOT_FOUND);
    }

    // update name + slug
    if (req.body.name) {
      const normalizedName = normalizeName(req.body.name);
      const slug = toSlug(normalizedName);

      const duplicate = await Category.findOne({
        slug,
        _id: { $ne: category._id },
        isDeleted: false
      });

      if (duplicate) {
        throw new AppError("Category name already exists", StatusCodes.CONFLICT);
      }

      category.name = normalizedName;
      category.slug = slug;
    }

    // update description
    if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
      category.description = req.body.description;
    }

    await category.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Category updated successfully",
      data: { category }
    });
  } catch (error) {
    return next(error);
  }
};

const freezeCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      isDeleted: false
    });
    if (!category) {
      throw new AppError("Category not found", StatusCodes.NOT_FOUND);
    }

    category.isFrozen = req.body.isFrozen;
    await category.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: category.isFrozen ? "Category frozen" : "Category unfrozen",
      data: { category }
    });
  } catch (error) {
    return next(error);
  }
};

const softDeleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!category) {
      throw new AppError("Category not found", StatusCodes.NOT_FOUND);
    }

    category.isActive = false;
    category.isFrozen = true;
    category.isDeleted = true;

    await category.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Category deleted successfully",
      data: { category }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPublicCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  freezeCategory,
  softDeleteCategory
};
