const { StatusCodes } = require("http-status-codes");
const { searchCities } = require("../services/address-autocomplete.service");

const getCities = async (req, res, next) => {
  try {
    const q = req.query.q || "";
    const lang = req.query.lang || "he";
    const restrict = req.query.restrict !== "false";
    const cities = searchCities(q, lang, { restrictToDeliveryAreas: restrict });
    return res.status(StatusCodes.OK).json({
      success: true,
      data: { cities }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCities
};
