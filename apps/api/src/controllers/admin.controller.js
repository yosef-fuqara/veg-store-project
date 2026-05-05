const { StatusCodes } = require("http-status-codes");

const getAdminPing = (req, res) =>
  res.status(StatusCodes.OK).json({
    success: true,
    message: `Welcome admin ${req.user.name}`
  });

module.exports = { getAdminPing };
