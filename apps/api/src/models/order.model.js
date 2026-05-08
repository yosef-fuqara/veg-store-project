const mongoose = require("mongoose");
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } = require("../constants/order");
const { ALLOWED_DELIVERY_AREA_KEYS } = require("../constants/delivery");

const deliveryAddressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 50 },
    city: { type: String, trim: true, required: true },
    street: { type: String, trim: true, required: true },
    building: { type: String, trim: true },
    apartment: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 500 }
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
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true, trim: true },
    isPreorderOnly: { type: Boolean, default: false },
    minAdvanceHours: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    deliveryAddress: { type: deliveryAddressSchema, required: true },
    deliveryArea: {
      type: String,
      required: true,
      enum: ALLOWED_DELIVERY_AREA_KEYS
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
    }
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);
