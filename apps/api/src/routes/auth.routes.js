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

const forgotPasswordLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: Math.min(10, env.rateLimitMax),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." }
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.get("/me", requireAuth, getMe);

module.exports = router;
