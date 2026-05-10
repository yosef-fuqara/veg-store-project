const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator(value) {
          if (value == null) return false;
          if (typeof value === "string") {
            const s = value.trim();
            return s.length >= 2 && s.length <= 80;
          }
          if (typeof value === "object" && !Array.isArray(value)) {
            const ar = typeof value.ar === "string" ? value.ar.trim() : "";
            const he = typeof value.he === "string" ? value.he.trim() : "";
            const en = typeof value.en === "string" ? value.en.trim() : "";
            return (
              ar.length >= 2 &&
              ar.length <= 80 &&
              he.length >= 2 &&
              he.length <= 80 &&
              en.length >= 2 &&
              en.length <= 80
            );
          }
          return false;
        },
        message:
          "Category name must be a legacy string (2–80 chars) or { ar, he, en } each 2–80 chars."
      }
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
