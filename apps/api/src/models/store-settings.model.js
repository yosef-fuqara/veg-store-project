const mongoose = require("mongoose");

const localizedStringSchema = new mongoose.Schema(
  {
    he: { type: String, trim: true, default: "" },
    en: { type: String, trim: true, default: "" },
    ar: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const storeSettingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: "default"
    },
    isStoreOpen: {
      type: Boolean,
      default: true
    },
    closedTitle: {
      type: localizedStringSchema,
      default: () => ({})
    },
    closedMessage: {
      type: localizedStringSchema,
      default: () => ({})
    },
    reopenAt: {
      type: Date,
      default: null
    },
    showWhatsappButton: {
      type: Boolean,
      default: true
    },
    operatingHoursEnabled: {
      type: Boolean,
      default: false
    },
    operatingTimezone: {
      type: String,
      trim: true,
      default: "Asia/Jerusalem"
    },
    operatingOpenLocal: {
      type: String,
      trim: true,
      default: "09:00"
    },
    operatingCloseLocal: {
      type: String,
      trim: true,
      default: "21:00"
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);
