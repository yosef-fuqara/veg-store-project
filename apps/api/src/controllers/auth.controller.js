const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model");
const AppError = require("../utils/app-error");
const env = require("../config/env");
const { signAccessToken, signRefreshToken } = require("../services/token.service");
const { generatePasswordResetToken, hashPasswordResetToken } = require("../utils/passwordResetToken");
const {
  sendPasswordResetEmail,
  buildPasswordResetUrl
} = require("../services/password-reset-email.service");

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
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
    const user = await User.findOne({ email });
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

const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for that email, we sent password reset instructions.";

const logDevAuth = (context, error) => {
  if (env.nodeEnv !== "development") {
    return;
  }
  // eslint-disable-next-line no-console
  console.error(`[auth] ${context}:`, error?.message || error);
};

const forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const user = await User.findOne({ email });

    if (user && user.isActive) {
      const plainToken = generatePasswordResetToken();
      const passwordResetTokenHash = hashPasswordResetToken(plainToken);
      const passwordResetExpires = new Date(Date.now() + env.passwordResetTtlMs);

      user.passwordResetTokenHash = passwordResetTokenHash;
      user.passwordResetExpires = passwordResetExpires;
      await user.save();

      const resetUrl = buildPasswordResetUrl(plainToken);
      try {
        await sendPasswordResetEmail({ to: user.email, resetUrl });
      } catch (error) {
        logDevAuth("password reset email failed", error);
      }
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: FORGOT_PASSWORD_MESSAGE
    });
  } catch (error) {
    return next(error);
  }
};

const RESET_PASSWORD_INVALID = "Invalid or expired reset link. Please request a new one.";

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const passwordResetTokenHash = hashPasswordResetToken(token);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const now = new Date();

    const result = await User.updateOne(
      {
        passwordResetTokenHash,
        passwordResetExpires: { $gt: now },
        isActive: true
      },
      {
        $set: {
          password: passwordHash,
          passwordResetTokenHash: null,
          passwordResetExpires: null
        }
      }
    );

    if (result.matchedCount === 0) {
      throw new AppError(RESET_PASSWORD_INVALID, StatusCodes.BAD_REQUEST);
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Password updated. You can sign in with your new password."
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
