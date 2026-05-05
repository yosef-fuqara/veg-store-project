const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model");
const AppError = require("../utils/app-error");
const { signAccessToken, signRefreshToken } = require("../services/token.service");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  role: user.role,
  addresses: user.addresses,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const register = async (req, res, next) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
    if (existingUser) {
      throw new AppError("Email already exists", StatusCodes.CONFLICT);
    }

    const password = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({
      ...req.body,
      email: req.body.email.toLowerCase(),
      password
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Registration successful",
      data: {
        user: sanitizeUser(user),
        tokens: { accessToken, refreshToken }
      }
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new AppError("Account is inactive", StatusCodes.FORBIDDEN);
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Login successful",
      data: {
        user: sanitizeUser(user),
        tokens: { accessToken, refreshToken }
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res) =>
  res.status(StatusCodes.OK).json({
    success: true,
    data: { user: sanitizeUser(req.user) }
  });

module.exports = { register, login, getMe };
