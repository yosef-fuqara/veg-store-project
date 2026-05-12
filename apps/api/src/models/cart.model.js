const mongoose = require("mongoose");

const PURCHASE_MODE = ["quantity", "amount"];

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01
    },
    unitPriceSnapshot: {
      type: Number,
      required: true,
      min: 0
    },
    purchaseMode: {
      type: String,
      enum: PURCHASE_MODE,
      default: "quantity"
    },
    // Customer's requested basket value in ₪ when purchaseMode is "amount".
    requestedAmountIls: {
      type: Number,
      min: 0
    },
    // Optional cling-film wrapping service. Only meaningful for kg-based
    // produce; the cart service will silently ignore it for other units so a
    // stale toggle never charges the customer.
    wrap: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    items: {
      type: [cartItemSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
