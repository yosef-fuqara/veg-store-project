const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model");
const { USER_ROLES } = require("../constants/roles");

const getAdminPing = (req, res) =>
  res.status(StatusCodes.OK).json({
    success: true,
    message: `Welcome admin ${req.user.name}`
  });

const listMarketingCustomers = async (_req, res, next) => {
  try {
    const customers = await User.find({
      role: USER_ROLES.CUSTOMER,
      marketingConsentWhatsApp: true
    })
      .sort({ marketingConsentWhatsAppAt: -1, createdAt: -1 })
      .select("name phone marketingConsentWhatsApp marketingConsentWhatsAppAt marketingConsentSource")
      .lean();

    return res.status(StatusCodes.OK).json({
      success: true,
      data: { customers }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAdminPing, listMarketingCustomers };
