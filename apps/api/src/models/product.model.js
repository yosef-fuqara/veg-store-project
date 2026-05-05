const mongoose = require("mongoose");
const { PRODUCT_UNITS, PRODUCT_STOCK_STATUS } = require("../constants/product");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
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
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }

  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });
productSchema.index({ isActive: 1, isFrozen: 1, isDeleted: 1, category: 1 });
module.exports = mongoose.model("Product", productSchema);
