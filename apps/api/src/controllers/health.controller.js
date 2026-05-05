const { StatusCodes } = require("http-status-codes");

const getHealth = (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString()
  });
};

module.exports = { getHealth };
