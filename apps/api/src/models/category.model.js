const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    isFrozen: {
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

categorySchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
module.exports = mongoose.model("Category", categorySchema);
