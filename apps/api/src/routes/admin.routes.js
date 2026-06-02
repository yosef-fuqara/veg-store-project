const express = require("express");
const { getAdminPing, listMarketingCustomers } = require("../controllers/admin.controller");
const {
  getAdminStoreSettings,
  patchAdminStoreSettings
} = require("../controllers/store-settings.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { USER_ROLES } = require("../constants/roles");
const validate = require("../middlewares/validate.middleware");
const { patchAdminStoreSettingsSchema } = require("../validators/store-settings.validator");
const {
  previewMarketingCampaignSchema,
  sendMarketingCampaignSchema
} = require("../validators/admin-marketing.validator");
const {
  getMarketingRecipientsCount,
  previewMarketingCampaign,
  sendMarketingCampaign
} = require("../controllers/admin-marketing.controller");

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
router.get(
  "/marketing-customers",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  listMarketingCustomers
);
router.get(
  "/marketing/recipients/count",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  getMarketingRecipientsCount
);
router.post(
  "/marketing/campaigns/preview",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(previewMarketingCampaignSchema),
  previewMarketingCampaign
);
router.post(
  "/marketing/campaigns/send",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(sendMarketingCampaignSchema),
  sendMarketingCampaign
);

module.exports = router;
