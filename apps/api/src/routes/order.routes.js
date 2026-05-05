const express = require("express");
const {
  createOrder,
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
const {
  orderIdParamSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  adminOrderListQuerySchema,
  updateOrderPaymentStatusSchema
} = require("../validators/order.validator");

const router = express.Router();

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

router.post(
  "/",
  requireAuth,
  requireRole(USER_ROLES.CUSTOMER),
  validate(createOrderSchema),
  createOrder
);
router.get("/", requireAuth, requireRole(USER_ROLES.CUSTOMER), listMyOrders);
router.get(
  "/:id",
  requireAuth,
  requireRole(USER_ROLES.CUSTOMER),
  validate(orderIdParamSchema, "params"),
  getMyOrder
);

module.exports = router;
