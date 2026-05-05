const { StatusCodes } = require("http-status-codes");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const AppError = require("../utils/app-error");
const { buildCheckoutPreview } = require("../services/cart.service");
const {
  getDeliveryFee,
  buildOrderItemsFromPreview,
  getInitialPaymentStatus,
  assertOrderStatusTransition
} = require("../services/order.service");
const { adminUpdateBankTransferPayment } = require("../services/payment.service");
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

    const preview = await buildCheckoutPreview(cart.items);
    const deliveryFee = getDeliveryFee(req.body.deliveryZone);
    const subtotal = preview.subtotal;
    const total = subtotal + deliveryFee;
    const items = buildOrderItemsFromPreview(preview.items);
    const paymentStatus = getInitialPaymentStatus(req.body.paymentMethod);

    const order = await Order.create({
      user: req.user._id,
      items,
      subtotal,
      deliveryFee,
      total,
      deliveryAddress: req.body.deliveryAddress,
      deliveryZone: req.body.deliveryZone,
      customerPhone: req.body.customerPhone,
      notes: req.body.notes || "",
      paymentMethod: req.body.paymentMethod,
      paymentStatus,
      orderStatus: ORDER_STATUS.NEW
    });

    cart.items = [];
    await cart.save();

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Order created successfully",
      data: { order }
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
  listMyOrders,
  getMyOrder,
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminUpdatePaymentStatus
};
