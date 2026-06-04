const { StatusCodes } = require("http-status-codes");
const Cart = require("../models/cart.model");
const Order = require("../models/order.model");
const AppError = require("../utils/app-error");
const { buildCheckoutPreview, floorPayableIls } = require("../services/cart.service");
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
const { notifyOrderCreated, notifyOrderStatusChanged } = require("../services/order-notification.service");
const {
  ALLOWED_DELIVERY_AREAS,
  LOCAL_DELIVERY_AREA,
  LOCAL_FREE_DELIVERY_MIN,
  OUTSIDE_FREE_DELIVERY_MIN,
  LOCAL_DELIVERY_FEE,
  OUTSIDE_DELIVERY_FEE,
  snapshotCityForOrder
} = require("../constants/delivery");
const { normalizeStructuredAddress } = require("../utils/structured-address");
const { ORDER_STATUS, PAYMENT_METHOD } = require("../constants/order");
const { scheduleBankTransferOrderCreated } = require("../services/order-email.service");
const {
  uploadBufferToCloudinary,
  destroyCloudinaryImage
} = require("../services/image-upload.service");
const { getOrderCreationBlockResponse } = require("../services/store-settings.service");
const User = require("../models/user.model");
const {
  buildOrderLegalSnapshot,
  applyMarketingConsent,
  applyLegalAcceptance,
  applyCustomerClubJoin,
  applySavedDetailsConsent,
  coerceBool,
  getRequestIp,
  getRequestUserAgent
} = require("../services/consent.service");
const { normalizeConsentLanguage } = require("../constants/legal-versions");

/**
 * Admin order JSON: join user + each line's Product so `items[].product.imageUrl`
 * matches the live catalog field used by the storefront (`ProductCard` / product API).
 * Does not alter stored order rows or pricing.
 */
const ADMIN_ORDER_RESPONSE_POPULATE = [
  {
    path: "user",
    select:
      "name email phone marketingConsentWhatsApp marketingConsentWhatsAppAt marketingConsentSource marketing customerClub legal savedDetails"
  },
  { path: "items.product", select: "imageUrl" }
];

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

const guestPayloadItemsToCartLines = (items) =>
  items.map((line) => {
    if (typeof line.purchaseAmountIls === "number") {
      return {
        product: line.product,
        quantity: typeof line.quantity === "number" ? line.quantity : 1,
        wrap: Boolean(line.wrap),
        purchaseMode: "amount",
        requestedAmountIls: line.purchaseAmountIls
      };
    }
    return {
      product: line.product,
      quantity: line.quantity,
      wrap: Boolean(line.wrap)
    };
  });

const buildDeliveryAddressFromBody = (deliveryArea, submittedAddress = {}, lang = "he") => {
  const area = getDeliveryArea(deliveryArea);
  const cityFromArea = snapshotCityForOrder(area);
  const normalized = normalizeStructuredAddress(
    {
      ...submittedAddress,
      city: submittedAddress.city || cityFromArea
    },
    { lang, cityKey: deliveryArea }
  );
  const key = typeof deliveryArea === "string" ? deliveryArea.trim() : "";
  return {
    label: normalized.label || "",
    city: normalized.city || cityFromArea,
    cityKey: key,
    cityId: key,
    citySlug: key,
    street: normalized.street,
    houseNumber: normalized.houseNumber,
    building: normalized.building || "",
    apartment: normalized.apartment || "",
    floor: normalized.floor || "",
    entrance: normalized.entrance || "",
    notes: normalized.notes || "",
    fullAddress: normalized.fullAddress
  };
};

const createOrderFromPreview = async ({
  preview,
  req,
  body,
  userId,
  customerName,
  customerEmail,
  file
}) => {
  const orderBlock = await getOrderCreationBlockResponse();
  if (orderBlock) {
    return { blocked: orderBlock };
  }

  let orderLegalSnapshot;
  if (userId) {
    const accountUser = await User.findById(userId).select("legal marketing customerClub");
    orderLegalSnapshot = buildOrderLegalSnapshot(req, {
      acceptedFrom: "checkout",
      user: accountUser
    });
  } else {
    orderLegalSnapshot = buildOrderLegalSnapshot(req, { acceptedFrom: "checkout" });
  }

  const { deliveryArea } = body;
  assertDeliveryAreaAllowed(deliveryArea);

  const subtotal = preview.subtotal;
  const wrapTotal = Number(preview.wrapTotal) || 0;
  const deliveryFee = calculateDeliveryFee(deliveryArea, subtotal);
  const total = floorPayableIls(subtotal + wrapTotal + deliveryFee);

  const { hasPreorderItems, preferredDeliveryAt } = assertPreorderTiming(
    preview.items,
    body.preferredDeliveryAt
  );

  const items = buildOrderItemsFromPreview(preview.items);
  const paymentStatus = getInitialPaymentStatus(body.paymentMethod);
  const deliveryAddress = buildDeliveryAddressFromBody(
    deliveryArea,
    body.deliveryAddress || {},
    normalizeConsentLanguage(body.consentLanguage) || "he"
  );

  let bankTransferProofUrl = "";
  let bankTransferProofPublicId = "";
  if (file) {
    if (body.paymentMethod !== PAYMENT_METHOD.BANK_TRANSFER) {
      throw new AppError(
        "Payment proof image is only allowed for bank transfer orders",
        StatusCodes.BAD_REQUEST
      );
    }
    const folderBase = process.env.CLOUDINARY_FOLDER || "veg-store";
    const folder = `${folderBase}/bank-transfer-proofs`;
    const uploadResult = await uploadBufferToCloudinary(file.buffer, folder);
    bankTransferProofUrl = uploadResult.secure_url;
    bankTransferProofPublicId = uploadResult.public_id;
  }

  const emailTrimmed =
    typeof customerEmail === "string" && customerEmail.trim() ? customerEmail.trim() : "";

  let order;
  try {
    order = await Order.create({
      user: userId || null,
      customerName: customerName || undefined,
      customerEmail: emailTrimmed || undefined,
      items,
      subtotal,
      wrapTotal,
      deliveryFee,
      total,
      deliveryAddress,
      deliveryArea,
      customerPhone: body.customerPhone,
      notes: body.notes || "",
      customRequest: body.customRequest || "",
      preferredDeliveryAt,
      hasPreorderItems,
      paymentMethod: body.paymentMethod,
      paymentStatus,
      orderStatus: ORDER_STATUS.NEW,
      orderLegalSnapshot,
      ...(bankTransferProofUrl ? { bankTransferProofUrl, bankTransferProofPublicId } : {})
    });
  } catch (err) {
    if (bankTransferProofPublicId) {
      await destroyCloudinaryImage(bankTransferProofPublicId).catch(() => {});
    }
    throw err;
  }

  return { order, bankTransferProofPublicId };
};

/**
 * Persist consent choices made during checkout onto the registered user's
 * profile. Best-effort: never blocks order completion. Marketing/club/saved
 * details are opt-in; the required terms acceptance is also recorded.
 */
const applyCheckoutConsentToUser = async (req) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return;

    const language =
      normalizeConsentLanguage(req.body.consentLanguage) ||
      normalizeConsentLanguage(req.headers?.["x-app-language"]);
    const ipAddress = getRequestIp(req);
    const userAgent = getRequestUserAgent(req);

    applyLegalAcceptance(user, { from: "checkout", language, ipAddress, userAgent });

    // Only flip marketing consent ON from checkout (never silently turn it off).
    if (coerceBool(req.body.marketingConsent)) {
      applyMarketingConsent(user, true, {
        source: "checkout",
        language,
        channels: { whatsapp: true, sms: true }
      });
    }
    if (coerceBool(req.body.joinCustomerClub)) {
      applyCustomerClubJoin(user, { language });
    }
    if ("saveDetailsConsent" in req.body) {
      applySavedDetailsConsent(user, coerceBool(req.body.saveDetailsConsent));
    }

    await user.save();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[order] failed to persist checkout consent: ${err?.message}`);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    if (!cart.items.length) {
      throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
    }

    const preview = await buildCheckoutPreview(cart.items);
    const result = await createOrderFromPreview({
      preview,
      req,
      body: req.body,
      userId: req.user._id,
      file: req.file
    });

    if (result.blocked) {
      return res.status(result.blocked.statusCode).json(result.blocked.body);
    }

    const { order } = result;
    cart.items = [];
    await cart.save();

    await applyCheckoutConsentToUser(req);

    // eslint-disable-next-line no-console
    console.info(`[order] created id=${order._id} total=${order.total} payment=${order.paymentMethod}`);
    notifyOrderCreated(order, req.user);

    if (req.body.paymentMethod === PAYMENT_METHOD.BANK_TRANSFER) {
      scheduleBankTransferOrderCreated(order._id);
    }

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Order created successfully",
      data: { order }
    });
  } catch (error) {
    return next(error);
  }
};

const guestCheckoutPreview = async (req, res, next) => {
  try {
    const cartLines = guestPayloadItemsToCartLines(req.body.items);
    const preview = await buildCheckoutPreview(cartLines);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Checkout data revalidated",
      data: { checkout: preview }
    });
  } catch (error) {
    return next(error);
  }
};

const createGuestOrder = async (req, res, next) => {
  try {
    const cartLines = guestPayloadItemsToCartLines(req.body.items);
    if (!cartLines.length) {
      throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
    }

    const preview = await buildCheckoutPreview(cartLines);
    const result = await createOrderFromPreview({
      preview,
      req,
      body: req.body,
      userId: null,
      customerName: req.body.customerName,
      customerEmail: req.body.customerEmail,
      file: req.file
    });

    if (result.blocked) {
      return res.status(result.blocked.statusCode).json(result.blocked.body);
    }

    const { order } = result;

    // eslint-disable-next-line no-console
    console.info(`[order] guest created id=${order._id} total=${order.total} payment=${order.paymentMethod}`);
    notifyOrderCreated(order, null);

    if (req.body.paymentMethod === PAYMENT_METHOD.BANK_TRANSFER) {
      scheduleBankTransferOrderCreated(order._id);
    }

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
        areas: ALLOWED_DELIVERY_AREAS.map((a) => ({
          key: a.key,
          names: a.names,
          isLocal: a.isLocal,
          label: a.names?.en || a.names?.he || a.names?.ar || a.key
        })),
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
    const order = await Order.findById(req.params.id).populate(ADMIN_ORDER_RESPONSE_POPULATE);

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

    const previousOrderStatus = order.orderStatus;
    assertOrderStatusTransition(order.orderStatus, req.body.orderStatus);
    order.orderStatus = req.body.orderStatus;
    await order.save();

    if (previousOrderStatus !== order.orderStatus) {
      notifyOrderStatusChanged(order._id, order.orderStatus);
    }

    await order.populate(ADMIN_ORDER_RESPONSE_POPULATE);

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
    await order.populate(ADMIN_ORDER_RESPONSE_POPULATE);

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
  guestCheckoutPreview,
  createGuestOrder,
  getDeliveryAreas,
  listMyOrders,
  getMyOrder,
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminUpdatePaymentStatus
};
