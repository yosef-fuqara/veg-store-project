const { StatusCodes } = require("http-status-codes");
const {
  getStoreSettingsDocument,
  toPublicPayload,
  toAdminPayload,
  updateStoreSettings
} = require("../services/store-settings.service");

const getPublicStoreSettings = async (_req, res, next) => {
  try {
    const doc = await getStoreSettingsDocument();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: { settings: toPublicPayload(doc) }
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminStoreSettings = async (_req, res, next) => {
  try {
    const doc = await getStoreSettingsDocument();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: { settings: toAdminPayload(doc) }
    });
  } catch (error) {
    return next(error);
  }
};

const patchAdminStoreSettings = async (req, res, next) => {
  try {
    const doc = await updateStoreSettings(req.user._id, req.body);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Store settings updated",
      data: { settings: toAdminPayload(doc) }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPublicStoreSettings,
  getAdminStoreSettings,
  patchAdminStoreSettings
};
