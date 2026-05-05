const { StatusCodes } = require("http-status-codes");
const { handleWebhook } = require("../services/payment.service");

const postWebhook = async (req, res, next) => {
  try {
    const result = await handleWebhook(req);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  postWebhook
};
