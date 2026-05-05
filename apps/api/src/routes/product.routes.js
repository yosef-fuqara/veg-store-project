const express = require("express");
const {
  getPublicProducts,
  getPublicProductById,
  getAdminProducts,
  createProduct,
  updateProduct,
  freezeProduct,
  softDeleteProduct
} = require("../controllers/product.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { USER_ROLES } = require("../constants/roles");
const validate = require("../middlewares/validate.middleware");
const {
  productIdParamSchema,
  createProductSchema,
  updateProductSchema,
  freezeProductSchema,
  publicProductQuerySchema
} = require("../validators/product.validator");
const { upload, handleUploadErrors } = require("../middlewares/upload.middleware");
const normalizeProductBody = require("../middlewares/normalize-product-body.middleware");

const router = express.Router();

router.get(
  "/admin/all",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  getAdminProducts
);
router.get("/", validate(publicProductQuerySchema, "query"), getPublicProducts);
router.get(
  "/:id",
  validate(productIdParamSchema, "params"),
  getPublicProductById
);

router.post(
  "/",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  upload.single("image"),
  handleUploadErrors,
  normalizeProductBody,
  validate(createProductSchema),
  createProduct
);

router.patch(
  "/:id",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  upload.single("image"),
  handleUploadErrors,
  normalizeProductBody,
  validate(productIdParamSchema, "params"),
  validate(updateProductSchema),
  updateProduct
);

router.patch(
  "/:id/freeze",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(productIdParamSchema, "params"),
  validate(freezeProductSchema),
  freezeProduct
);

router.delete(
  "/:id",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(productIdParamSchema, "params"),
  softDeleteProduct
);

module.exports = router;
