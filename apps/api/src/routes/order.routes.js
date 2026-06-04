const express = require("express");
const {
  createOrder,
  guestCheckoutPreview,
  createGuestOrder,
  getDeliveryAreas,
  listMyOrders,
  getMyOrder,
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminUpdatePaymentStatus
} = require("../controllers/order.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { USER_ROLES } = require("../constants/roles");
const validate = require("../middlewares/validate.middleware");
const { upload, handleUploadErrors } = require("../middlewares/upload.middleware");
const parseOrderCreateBody = require("../middlewares/parse-order-create-body.middleware");
const {
  orderIdParamSchema,
  createOrderSchema,
  guestCheckoutPreviewSchema,
  createGuestOrderSchema,
  updateOrderStatusSchema,
  adminOrderListQuerySchema,
  updateOrderPaymentStatusSchema
} = require("../validators/order.validator");

const router = express.Router();

// Public — allowed delivery areas and pricing rules for the storefront.
router.get("/delivery-areas", getDeliveryAreas);

router.post(
  "/guest/preview",
  validate(guestCheckoutPreviewSchema),
  guestCheckoutPreview
);
router.post(
  "/guest",
  upload.single("bankTransferProof"),
  handleUploadErrors,
  parseOrderCreateBody,
  validate(createGuestOrderSchema),
  createGuestOrder
);

router.get(
  "/admin/all",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(adminOrderListQuerySchema, "query"),
  adminListOrders
);
router.get(
  "/admin/:id",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(orderIdParamSchema, "params"),
  adminGetOrder
);
router.patch(
  "/admin/:id/status",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(orderIdParamSchema, "params"),
  validate(updateOrderStatusSchema),
  adminUpdateOrderStatus
);
router.patch(
  "/admin/:id/payment-status",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(orderIdParamSchema, "params"),
  validate(updateOrderPaymentStatusSchema),
  adminUpdatePaymentStatus
);

const requireStorefrontOrderActor = requireRole(
  USER_ROLES.CUSTOMER,
  USER_ROLES.ADMIN
);

router.post(
  "/",
  requireAuth,
  requireStorefrontOrderActor,
  upload.single("bankTransferProof"),
  handleUploadErrors,
  parseOrderCreateBody,
  validate(createOrderSchema),
  createOrder
);
router.get("/", requireAuth, requireStorefrontOrderActor, listMyOrders);
router.get(
  "/:id",
  requireAuth,
  requireStorefrontOrderActor,
  validate(orderIdParamSchema, "params"),
  getMyOrder
);

module.exports = router;
