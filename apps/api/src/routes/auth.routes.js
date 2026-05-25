const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, getMe, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require("../validators/auth.validator");
const validate = require("../middlewares/validate.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");
const env = require("../config/env");

const router = express.Router();

const rateLimitMessage = {
  success: false,
  message: "Too many requests. Please try again later.",
  code: "RATE_LIMITED",
};

const forgotPasswordLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: Math.min(10, env.rateLimitMax),
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

/** Brute-force protection in production only (global limiter is disabled in dev). */
const loginLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.nodeEnv === "production" ? 30 : 10_000,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

router.post("/register", validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.get("/me", requireAuth, getMe);

module.exports = router;
