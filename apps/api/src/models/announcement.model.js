const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    imageUrl: {
      type: String,
      trim: true,
      default: ""
    },
    imagePublicId: {
      type: String,
      trim: true,
      default: ""
    },
    buttonText: {
      type: String,
      trim: true,
      maxlength: 80,
      default: ""
    },
    buttonLink: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },
    cta: {
      text: {
        he: { type: String, trim: true, maxlength: 80, default: "" },
        en: { type: String, trim: true, maxlength: 80, default: "" },
        ar: { type: String, trim: true, maxlength: 80, default: "" }
      },
      type: {
        type: String,
        enum: ["none", "product", "category", "custom"],
        default: "none"
      },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null
      },
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
      },
      url: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: ""
      }
    },
    isActive: {
      type: Boolean,
      default: false
    },
    startsAt: {
      type: Date,
      required: true
    },
    endsAt: {
      type: Date,
      required: true
    },
    archivedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

announcementSchema.index({ isActive: 1, startsAt: 1, endsAt: 1, archivedAt: 1, updatedAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);
