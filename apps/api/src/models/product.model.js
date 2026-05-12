const mongoose = require("mongoose");
const { PRODUCT_UNITS, PRODUCT_STOCK_STATUS } = require("../constants/product");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator(value) {
          if (value == null) return false;
          if (typeof value === "string") {
            const s = value.trim();
            return s.length >= 2 && s.length <= 120;
          }
          if (typeof value === "object" && !Array.isArray(value)) {
            const ar = typeof value.ar === "string" ? value.ar.trim() : "";
            const he = typeof value.he === "string" ? value.he.trim() : "";
            const en = typeof value.en === "string" ? value.en.trim() : "";
            return (
              ar.length >= 2 &&
              ar.length <= 120 &&
              he.length >= 2 &&
              he.length <= 120 &&
              en.length >= 2 &&
              en.length <= 120
            );
          }
          return false;
        },
        message:
          "Product name must be a legacy string (2–120 chars) or { ar, he, en } each 2–120 chars."
      }
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: {
      type: Number,
      min: 0
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    imagePublicId: {
      type: String,
      required: true,
      trim: true
    },
    unit: {
      type: String,
      enum: Object.values(PRODUCT_UNITS),
      required: true
    },
    stockStatus: {
      type: String,
      enum: Object.values(PRODUCT_STOCK_STATUS),
      default: PRODUCT_STOCK_STATUS.IN_STOCK
    },
    isFrozen: {
      type: Boolean,
      default: false
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    // When true, customers may add to cart by ILS amount; server derives quantity.
    allowPurchaseByAmount: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    // Preorder-only items (e.g. fruit platters) require advance notice and
    // cannot be ordered for same-day delivery.
    isPreorderOnly: {
      type: Boolean,
      default: false
    },
    minAdvanceHours: {
      type: Number,
      default: 24,
      min: 0
    },
    preparationNotes: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  { timestamps: true }
);

productSchema.index({
  "name.ar": "text",
  "name.he": "text",
  "name.en": "text",
  description: "text"
});
productSchema.index({ isActive: 1, isFrozen: 1, isDeleted: 1, category: 1 });
module.exports = mongoose.model("Product", productSchema);
