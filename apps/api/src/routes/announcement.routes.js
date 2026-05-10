const express = require("express");
const {
  getActiveAnnouncement,
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  setAnnouncementActive,
  archiveAnnouncement,
  deleteAnnouncement
} = require("../controllers/announcement.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { USER_ROLES } = require("../constants/roles");
const validate = require("../middlewares/validate.middleware");
const { upload, handleUploadErrors } = require("../middlewares/upload.middleware");
const normalizeAnnouncementBody = require("../middlewares/normalize-announcement-body.middleware");
const {
  announcementIdParamSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
  setActiveSchema
} = require("../validators/announcement.validator");

const router = express.Router();

router.get("/active", getActiveAnnouncement);

router.get("/", requireAuth, requireRole(USER_ROLES.ADMIN), listAnnouncements);
router.post(
  "/",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  upload.single("image"),
  handleUploadErrors,
  normalizeAnnouncementBody,
  validate(createAnnouncementSchema),
  createAnnouncement
);
router.patch(
  "/:id",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  upload.single("image"),
  handleUploadErrors,
  normalizeAnnouncementBody,
  validate(announcementIdParamSchema, "params"),
  validate(updateAnnouncementSchema),
  updateAnnouncement
);
router.patch(
  "/:id/active",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(announcementIdParamSchema, "params"),
  validate(setActiveSchema),
  setAnnouncementActive
);
router.patch(
  "/:id/archive",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(announcementIdParamSchema, "params"),
  archiveAnnouncement
);
router.delete(
  "/:id",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(announcementIdParamSchema, "params"),
  deleteAnnouncement
);

module.exports = router;
