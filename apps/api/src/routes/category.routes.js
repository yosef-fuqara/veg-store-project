const express = require("express");
const {
  getPublicCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  freezeCategory,
  softDeleteCategory
} = require("../controllers/category.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { USER_ROLES } = require("../constants/roles");
const validate = require("../middlewares/validate.middleware");
const {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
  freezeCategorySchema
} = require("../validators/category.validator");

const router = express.Router();

router.get("/", getPublicCategories);
router.get("/admin/all", requireAuth, requireRole(USER_ROLES.ADMIN), getAdminCategories);
router.post("/", requireAuth, requireRole(USER_ROLES.ADMIN), validate(createCategorySchema), createCategory);
router.patch(
  "/:id",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(categoryIdParamSchema, "params"),
  validate(updateCategorySchema),
  updateCategory
);
router.patch(
  "/:id/freeze",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(categoryIdParamSchema, "params"),
  validate(freezeCategorySchema),
  freezeCategory
);
router.delete(
  "/:id",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(categoryIdParamSchema, "params"),
  softDeleteCategory
);

module.exports = router;
