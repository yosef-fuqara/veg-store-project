const mongoose = require("mongoose");
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD, FULFILLMENT_TYPE } = require("../constants/order");

const deliveryAddressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 50 },
    city: { type: String, trim: true, required: true },
    cityKey: { type: String, trim: true },
    cityId: { type: String, trim: true },
    citySlug: { type: String, trim: true },
    street: { type: String, trim: true, required: true },
    houseNumber: { type: String, trim: true },
    building: { type: String, trim: true },
    apartment: { type: String, trim: true },
    floor: { type: String, trim: true },
    entrance: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 500 },
    fullAddress: { type: String, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: { type: String, required: true, trim: true },
    // Immutable multilingual snapshot captured at order time (legacy orders may omit).
    nameLocales: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true, trim: true },
    purchaseMode: {
      type: String,
      enum: ["quantity", "amount"],
      default: "quantity"
    },
    requestedAmountIls: { type: Number, min: 0 },
    lineTotal: { type: Number, min: 0 },
    isPreorderOnly: { type: Boolean, default: false },
    minAdvanceHours: { type: Number, default: 0, min: 0 },
    // Snapshot of the wrap selection at order time so re-pricing is stable
    // even if the wrap rate changes later. wrapFee is the line-level cost.
    wrap: { type: Boolean, default: false },
    wrapFee: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

// Snapshot of consent/legal acceptance at the moment the order was placed.
const orderLegalSnapshotSchema = new mongoose.Schema(
  {
    termsAccepted: { type: Boolean, default: false },
    termsVersion: { type: String, default: null },
    privacyVersion: { type: String, default: null },
    shippingPolicyVersion: { type: String, default: null },
    cancellationPolicyVersion: { type: String, default: null },
    customerClubTermsVersion: { type: String, default: null },
    marketingConsentAtOrderTime: { type: Boolean, default: false },
    saveDetailsConsentAtOrderTime: { type: Boolean, default: false },
    customerClubJoinedAtOrderTime: { type: Boolean, default: false },
    acceptedAt: { type: Date, default: null },
    acceptedFrom: { type: String, default: null },
    acceptedLanguage: { type: String, enum: ["he", "ar", "en", null], default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    customerName: { type: String, trim: true, maxlength: 120 },
    customerEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    // Aggregated cling-film wrap surcharge across all items. Tracked
    // separately from `subtotal` so it never affects the free-delivery
    // threshold (wrap is a service, not an item).
    wrapTotal: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    fulfillmentType: {
      type: String,
      enum: Object.values(FULFILLMENT_TYPE),
      default: FULFILLMENT_TYPE.DELIVERY
    },
    deliveryAddress: { type: deliveryAddressSchema, required: true },
    // Not enum-restricted: legacy documents may carry retired area keys; new orders
    // are validated in Joi + order service.
    deliveryArea: {
      type: String,
      required: true,
      trim: true
    },
    customerPhone: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    customRequest: { type: String, trim: true, maxlength: 1000 },
    preferredDeliveryAt: { type: Date },
    hasPreorderItems: { type: Boolean, default: false },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      required: true
    },
    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.NEW
    },
    // Optional screenshot / receipt for bank transfer (Cloudinary)
    bankTransferProofUrl: { type: String, trim: true, default: "" },
    bankTransferProofPublicId: { type: String, trim: true, default: "" },
    // Idempotency keys for transactional email (ISO dates stored as values)
    emailNotifications: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    // Immutable snapshot of the legal/consent state captured when the order was
    // placed. Saved for guest and registered customers alike so we always know
    // exactly what was agreed at order time.
    orderLegalSnapshot: {
      type: orderLegalSnapshotSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);
