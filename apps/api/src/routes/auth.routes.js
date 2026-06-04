const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, getMe, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const {
  updateProfile,
  updateMarketingConsent,
  joinCustomerClub,
  leaveCustomerClub,
  updateSavedDetailsConsent,
  deleteSavedDeliveryDetails,
  requestAccountDeletion,
  changePassword,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getFavorites,
  addFavorite,
  removeFavorite
} = require("../controllers/account.controller");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require("../validators/auth.validator");
const {
  updateProfileSchema,
  updateMarketingConsentSchema,
  customerClubJoinSchema,
  savedDetailsConsentSchema,
  changePasswordSchema,
  addressBodySchema,
  addressPatchSchema,
  addressIdParamSchema,
  favoriteProductIdParamSchema
} = require("../validators/account.validator");
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
router.patch("/me", requireAuth, validate(updateProfileSchema), updateProfile);
router.patch(
  "/me/marketing-consent",
  requireAuth,
  validate(updateMarketingConsentSchema),
  updateMarketingConsent
);
router.post(
  "/me/customer-club",
  requireAuth,
  validate(customerClubJoinSchema),
  joinCustomerClub
);
router.delete("/me/customer-club", requireAuth, leaveCustomerClub);
router.patch(
  "/me/saved-details",
  requireAuth,
  validate(savedDetailsConsentSchema),
  updateSavedDetailsConsent
);
router.delete("/me/saved-details", requireAuth, deleteSavedDeliveryDetails);
router.post("/me/deletion-request", requireAuth, requestAccountDeletion);
router.patch("/me/password", requireAuth, validate(changePasswordSchema), changePassword);
router.post("/me/addresses", requireAuth, validate(addressBodySchema), createAddress);
router.patch(
  "/me/addresses/:addressId",
  requireAuth,
  validate(addressIdParamSchema, "params"),
  validate(addressPatchSchema),
  updateAddress
);
router.delete(
  "/me/addresses/:addressId",
  requireAuth,
  validate(addressIdParamSchema, "params"),
  deleteAddress
);
router.patch(
  "/me/addresses/:addressId/default",
  requireAuth,
  validate(addressIdParamSchema, "params"),
  setDefaultAddress
);
router.get("/me/favorites", requireAuth, getFavorites);
router.post(
  "/me/favorites/:productId",
  requireAuth,
  validate(favoriteProductIdParamSchema, "params"),
  addFavorite
);
router.delete(
  "/me/favorites/:productId",
  requireAuth,
  validate(favoriteProductIdParamSchema, "params"),
  removeFavorite
);

module.exports = router;
