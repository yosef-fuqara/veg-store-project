const { StatusCodes } = require("http-status-codes");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const AppError = require("../utils/app-error");
const { buildCheckoutPreview } = require("../services/cart.service");
const {
  calculateDeliveryFee,
  getDeliveryArea,
  buildOrderItemsFromPreview,
  getInitialPaymentStatus,
  assertOrderStatusTransition,
  assertDeliveryAreaAllowed,
  assertPreorderTiming
} = require("../services/order.service");
const { adminUpdateBankTransferPayment } = require("../services/payment.service");
const { notifyAdminOfNewOrder } = require("../services/whatsapp.service");
const {
  ALLOWED_DELIVERY_AREAS,
  LOCAL_DELIVERY_AREA,
  LOCAL_FREE_DELIVERY_MIN,
  OUTSIDE_FREE_DELIVERY_MIN,
  LOCAL_DELIVERY_FEE,
  OUTSIDE_DELIVERY_FEE
} = require("../constants/delivery");
const { ORDER_STATUS } = require("../constants/order");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

const createOrder = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    if (!cart.items.length) {
      throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
    }

    const { deliveryArea } = req.body;

    // Reject unsupported delivery areas before doing any expensive work.
    assertDeliveryAreaAllowed(deliveryArea);

    const preview = await buildCheckoutPreview(cart.items);
    const subtotal = preview.subtotal;
    const wrapTotal = Number(preview.wrapTotal) || 0;

    // Delivery fee thresholds are evaluated against item subtotal only —
    // wrap is a service surcharge and shouldn't push an order over the
    // "free delivery" line.
    const deliveryFee = calculateDeliveryFee(deliveryArea, subtotal);
    const total = subtotal + wrapTotal + deliveryFee;

    const { hasPreorderItems, preferredDeliveryAt } = assertPreorderTiming(
      preview.items,
      req.body.preferredDeliveryAt
    );

    const items = buildOrderItemsFromPreview(preview.items);
    const paymentStatus = getInitialPaymentStatus(req.body.paymentMethod);

    // City label is derived from the chosen area, not trusted from client.
    const area = getDeliveryArea(deliveryArea);
    const submittedAddress = req.body.deliveryAddress || {};
    const deliveryAddress = {
      label: submittedAddress.label || "",
      city: area.label,
      street: submittedAddress.street,
      building: submittedAddress.building || "",
      apartment: submittedAddress.apartment || "",
      notes: submittedAddress.notes || ""
    };

    const order = await Order.create({
      user: req.user._id,
      items,
      subtotal,
      wrapTotal,
      deliveryFee,
      total,
      deliveryAddress,
      deliveryArea,
      customerPhone: req.body.customerPhone,
      notes: req.body.notes || "",
      customRequest: req.body.customRequest || "",
      preferredDeliveryAt,
      hasPreorderItems,
      paymentMethod: req.body.paymentMethod,
      paymentStatus,
      orderStatus: ORDER_STATUS.NEW
    });

    cart.items = [];
    await cart.save();

    // Fire-and-forget admin notification. Failure here must NEVER fail the
    // order itself; the WhatsApp service swallows and logs errors.
    notifyAdminOfNewOrder(order, req.user).catch((err) => {
      // Defensive: notifier should already log internally.
      // eslint-disable-next-line no-console
      console.warn("[orders] admin notification dispatch error:", err?.message);
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Order created successfully",
      data: { order }
    });
  } catch (error) {
    return next(error);
  }
};

// Public endpoint exposing the allowed delivery areas + pricing rules so the
// storefront can render an accurate dropdown and helper text without
// duplicating constants. Backend is still the source of truth.
const getDeliveryAreas = async (_req, res, next) => {
  try {
    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        areas: ALLOWED_DELIVERY_AREAS,
        localAreaKey: LOCAL_DELIVERY_AREA,
        rules: {
          localFreeDeliveryMin: LOCAL_FREE_DELIVERY_MIN,
          outsideFreeDeliveryMin: OUTSIDE_FREE_DELIVERY_MIN,
          localDeliveryFee: LOCAL_DELIVERY_FEE,
          outsideDeliveryFee: OUTSIDE_DELIVERY_FEE
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

const listMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(StatusCodes.OK).json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    return next(error);
  }
};

const getMyOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND);
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    return next(error);
  }
};

const adminListOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.orderStatus) {
      filter.orderStatus = req.query.orderStatus;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name email phone")
      .lean();

    return res.status(StatusCodes.OK).json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    return next(error);
  }
};

const adminGetOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email phone");

    if (!order) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND);
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    return next(error);
  }
};

const adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND);
    }

    assertOrderStatusTransition(order.orderStatus, req.body.orderStatus);
    order.orderStatus = req.body.orderStatus;
    await order.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order status updated",
      data: { order }
    });
  } catch (error) {
    return next(error);
  }
};

const adminUpdatePaymentStatus = async (req, res, next) => {
  try {
    const order = await adminUpdateBankTransferPayment(req.params.id, req.body);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Payment status updated",
      data: { order }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  getDeliveryAreas,
  listMyOrders,
  getMyOrder,
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminUpdatePaymentStatus
};
