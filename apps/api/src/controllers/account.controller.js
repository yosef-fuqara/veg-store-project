const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const AppError = require("../utils/app-error");
const { sanitizeUser } = require("../utils/sanitize-user");

const MAX_ADDRESSES = 12;
const MAX_FAVORITES = 80;

const findAddressSubdoc = (user, addressId) => {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    return null;
  }
  return user.addresses.id(addressId);
};

const respondUser = (res, user) =>
  res.status(StatusCodes.OK).json({
    success: true,
    data: { user: sanitizeUser(user) }
  });

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    if (req.body.email) {
      const email = String(req.body.email).toLowerCase().trim();
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        throw new AppError("Email already exists", StatusCodes.CONFLICT);
      }
      user.email = email;
    }
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    if ("preferredLanguage" in req.body) {
      user.preferredLanguage = req.body.preferredLanguage || null;
    }

    await user.save();
    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

const updateMarketingConsent = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    const consent = req.body.marketingConsentWhatsApp === true;
    user.marketingConsentWhatsApp = consent;
    user.marketingConsentWhatsAppAt = consent ? new Date() : null;
    user.marketingConsentSource = consent ? "account_preferences" : null;

    await user.save();
    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    const valid = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!valid) {
      throw new AppError("Current password is incorrect", StatusCodes.BAD_REQUEST);
    }

    user.password = await bcrypt.hash(req.body.newPassword, 12);
    await user.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    return next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }
    if (user.addresses.length >= MAX_ADDRESSES) {
      throw new AppError(`You can save up to ${MAX_ADDRESSES} addresses`, StatusCodes.BAD_REQUEST);
    }

    user.addresses.push({
      label: req.body.label || "",
      city: req.body.city,
      street: req.body.street,
      building: req.body.building || "",
      apartment: req.body.apartment || "",
      notes: req.body.notes || ""
    });

    if (!user.defaultAddressId && user.addresses.length === 1) {
      user.defaultAddressId = user.addresses[user.addresses.length - 1]._id;
    }

    await user.save();
    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    const addr = findAddressSubdoc(user, req.params.addressId);
    if (!addr) {
      throw new AppError("Address not found", StatusCodes.NOT_FOUND);
    }

    if (req.body.label !== undefined) addr.label = req.body.label || "";
    if (req.body.city !== undefined) addr.city = req.body.city;
    if (req.body.street !== undefined) addr.street = req.body.street;
    if (req.body.building !== undefined) addr.building = req.body.building || "";
    if (req.body.apartment !== undefined) addr.apartment = req.body.apartment || "";
    if (req.body.notes !== undefined) addr.notes = req.body.notes || "";

    await user.save();
    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    const addr = findAddressSubdoc(user, req.params.addressId);
    if (!addr) {
      throw new AppError("Address not found", StatusCodes.NOT_FOUND);
    }

    const removedId = String(addr._id);
    addr.deleteOne();

    if (user.defaultAddressId && String(user.defaultAddressId) === removedId) {
      user.defaultAddressId = user.addresses[0]?._id || null;
    }

    await user.save();
    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

const setDefaultAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }

    const addr = findAddressSubdoc(user, req.params.addressId);
    if (!addr) {
      throw new AppError("Address not found", StatusCodes.NOT_FOUND);
    }

    user.defaultAddressId = addr._id;
    await user.save();
    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

const publicProductFilter = {
  isActive: true,
  isFrozen: false,
  isDeleted: { $ne: true }
};

const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("favoriteProductIds");
    const ids = user?.favoriteProductIds || [];
    if (!ids.length) {
      return res.status(StatusCodes.OK).json({ success: true, data: { products: [] } });
    }

    const products = await Product.find({ _id: { $in: ids }, ...publicProductFilter })
      .populate({
        path: "category",
        select: "name slug isActive isFrozen isDeleted",
        match: { isActive: true, isFrozen: false, isDeleted: false }
      });

    const byId = new Map(products.filter((p) => p.category).map((p) => [String(p._id), p]));
    const ordered = ids.map((id) => byId.get(String(id))).filter(Boolean);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: { products: ordered }
    });
  } catch (error) {
    return next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findOne({ _id: productId, ...publicProductFilter });
    if (!product) {
      throw new AppError("Product not found", StatusCodes.NOT_FOUND);
    }

    const user = await User.findById(req.user._id);
    const idStr = String(productId);
    const exists = user.favoriteProductIds.some((id) => String(id) === idStr);
    if (!exists) {
      if (user.favoriteProductIds.length >= MAX_FAVORITES) {
        throw new AppError(`You can save up to ${MAX_FAVORITES} favorites`, StatusCodes.BAD_REQUEST);
      }
      user.favoriteProductIds.push(productId);
      await user.save();
    }

    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const idStr = String(req.params.productId);
    user.favoriteProductIds = user.favoriteProductIds.filter((id) => String(id) !== idStr);
    await user.save();
    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  updateProfile,
  updateMarketingConsent,
  changePassword,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getFavorites,
  addFavorite,
  removeFavorite
};
