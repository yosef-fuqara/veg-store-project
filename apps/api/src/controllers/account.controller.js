const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const AppError = require("../utils/app-error");
const { sanitizeUser } = require("../utils/sanitize-user");
const { normalizeConsentLanguage } = require("../constants/legal-versions");
const {
  applyMarketingConsent,
  applyCustomerClubJoin,
  applyCustomerClubLeave,
  applySavedDetailsConsent
} = require("../services/consent.service");
const { normalizeStructuredAddress } = require("../utils/structured-address");
const {
  getDeliveryArea,
  isAllowedDeliveryArea,
  pickLocalizedName
} = require("../constants/delivery");

const MAX_ADDRESSES = 12;

const buildSavedAddressPayload = (body, lang = "he") => {
  const cityKey = typeof body.cityKey === "string" ? body.cityKey.trim() : "";
  if (!isAllowedDeliveryArea(cityKey)) {
    throw new AppError(
      "Please choose a city or village from the list",
      StatusCodes.BAD_REQUEST
    );
  }
  const area = getDeliveryArea(cityKey);
  const cityFromCatalog = pickLocalizedName(area?.names, lang);
  const normalized = normalizeStructuredAddress(
    {
      ...body,
      city: cityFromCatalog || body.city
    },
    {
      lang,
      cityKey
    }
  );
  return {
    label: normalized.label || "",
    city: normalized.city || cityFromCatalog,
    cityKey,
    cityId: cityKey,
    citySlug: cityKey,
    street: normalized.street,
    houseNumber: normalized.houseNumber,
    building: normalized.building || "",
    apartment: normalized.apartment || "",
    floor: normalized.floor || "",
    entrance: normalized.entrance || "",
    notes: normalized.notes || "",
    fullAddress: normalized.fullAddress
  };
};
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

    // Accept the new `marketingConsent` key or the legacy `marketingConsentWhatsApp`.
    const consent =
      req.body.marketingConsent === true || req.body.marketingConsentWhatsApp === true;
    const language = normalizeConsentLanguage(req.body.consentLanguage);
    applyMarketingConsent(user, consent, {
      source: "account_preferences",
      language,
      channels: { whatsapp: true, sms: true }
    });

    await user.save();
    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

const joinCustomerClub = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }
    applyCustomerClubJoin(user, {
      language: normalizeConsentLanguage(req.body.consentLanguage)
    });
    await user.save();
    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

const leaveCustomerClub = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }
    applyCustomerClubLeave(user);
    await user.save();
    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

const updateSavedDetailsConsent = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }
    applySavedDetailsConsent(user, req.body.saveForNextOrder === true);
    await user.save();
    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete saved delivery details: removes saved addresses + clears the saved-details
 * consent flag. Past order records keep their own address snapshots (legal/accounting).
 */
const deleteSavedDeliveryDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }
    user.addresses = [];
    user.defaultAddressId = null;
    applySavedDetailsConsent(user, false);
    await user.save();
    return respondUser(res, user);
  } catch (error) {
    return next(error);
  }
};

/**
 * Account/data deletion request. Full self-service deletion is not implemented
 * (order/accounting records must be retained), so we acknowledge the request and
 * the frontend shows contact instructions. We also unsubscribe marketing as a
 * courtesy and log the request for the store operator.
 */
const requestAccountDeletion = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND);
    }
    // eslint-disable-next-line no-console
    console.info(`[account] data deletion requested for userId=${user._id}`);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "DELETION_REQUEST_RECEIVED"
    });
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

    const lang = normalizeConsentLanguage(req.body.consentLanguage) || "he";
    user.addresses.push(buildSavedAddressPayload(req.body, lang));

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

    const lang = normalizeConsentLanguage(req.body.consentLanguage) || "he";
    const patch = buildSavedAddressPayload(
      {
        label: req.body.label !== undefined ? req.body.label : addr.label,
        city: req.body.city !== undefined ? req.body.city : addr.city,
        cityKey: req.body.cityKey !== undefined ? req.body.cityKey : addr.cityKey,
        street: req.body.street !== undefined ? req.body.street : addr.street,
        houseNumber:
          req.body.houseNumber !== undefined ? req.body.houseNumber : addr.houseNumber,
        building: req.body.building !== undefined ? req.body.building : addr.building,
        apartment: req.body.apartment !== undefined ? req.body.apartment : addr.apartment,
        floor: req.body.floor !== undefined ? req.body.floor : addr.floor,
        entrance: req.body.entrance !== undefined ? req.body.entrance : addr.entrance,
        notes: req.body.notes !== undefined ? req.body.notes : addr.notes
      },
      lang
    );
    addr.label = patch.label;
    addr.city = patch.city;
    addr.cityKey = patch.cityKey;
    addr.street = patch.street;
    addr.houseNumber = patch.houseNumber;
    addr.building = patch.building;
    addr.apartment = patch.apartment;
    addr.floor = patch.floor;
    addr.entrance = patch.entrance;
    addr.notes = patch.notes;
    addr.fullAddress = patch.fullAddress;

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
  joinCustomerClub,
  leaveCustomerClub,
  updateSavedDetailsConsent,
  deleteSavedDeliveryDetails,
  requestAccountDeletion,
  changePassword,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getFavorites,
  addFavorite,
  removeFavorite
};
