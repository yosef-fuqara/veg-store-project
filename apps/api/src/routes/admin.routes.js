const express = require("express");
const { getAdminPing } = require("../controllers/admin.controller");
const {
  getAdminStoreSettings,
  patchAdminStoreSettings
} = require("../controllers/store-settings.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { USER_ROLES } = require("../constants/roles");
const validate = require("../middlewares/validate.middleware");
const { patchAdminStoreSettingsSchema } = require("../validators/store-settings.validator");

const router = express.Router();

router.get("/ping", requireAuth, requireRole(USER_ROLES.ADMIN), getAdminPing);

router.get(
  "/store-settings",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  getAdminStoreSettings
);
router.patch(
  "/store-settings",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(patchAdminStoreSettingsSchema),
  patchAdminStoreSettings
);

module.exports = router;
