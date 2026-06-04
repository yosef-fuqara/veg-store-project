const mongoose = require("mongoose");
const { USER_ROLES } = require("../constants/roles");

const addressSchema = new mongoose.Schema(
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
  { _id: true }
);

// Legal/consent acceptance snapshot (terms, privacy, shipping, cancellation).
const legalConsentSchema = new mongoose.Schema(
  {
    acceptedTerms: { type: Boolean, default: false },
    acceptedTermsAt: { type: Date, default: null },
    acceptedTermsVersion: { type: String, default: null },
    acceptedPrivacyVersion: { type: String, default: null },
    acceptedShippingPolicyVersion: { type: String, default: null },
    acceptedCancellationPolicyVersion: { type: String, default: null },
    acceptedFrom: { type: String, default: null }, // e.g. "register", "checkout"
    acceptedLanguage: { type: String, enum: ["he", "ar", "en", null], default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null }
  },
  { _id: false }
);

// Structured marketing consent. Kept separate from service/order messaging.
const marketingConsentSchema = new mongoose.Schema(
  {
    consent: { type: Boolean, default: false },
    consentAt: { type: Date, default: null },
    consentSource: { type: String, default: null },
    consentTextVersion: { type: String, default: null },
    consentLanguage: { type: String, enum: ["he", "ar", "en", null], default: null },
    channels: {
      whatsapp: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: false }
    },
    unsubscribedAt: { type: Date, default: null },
    unsubscribeSource: { type: String, default: null }
  },
  { _id: false }
);

const savedDetailsSchema = new mongoose.Schema(
  {
    saveForNextOrder: { type: Boolean, default: false },
    savedAt: { type: Date, default: null }
  },
  { _id: false }
);

const customerClubSchema = new mongoose.Schema(
  {
    joined: { type: Boolean, default: false },
    joinedAt: { type: Date, default: null },
    termsVersion: { type: String, default: null },
    joinedLanguage: { type: String, enum: ["he", "ar", "en", null], default: null },
    leftAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "left", "suspended", null],
      default: null
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    phone: { type: String, required: true, trim: true, minlength: 7, maxlength: 20 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    // Legacy flat marketing fields — kept for backward compatibility. New code
    // reads/writes the structured `marketing` subdocument below. Both are kept
    // in sync so existing admin/marketing tooling keeps working.
    marketingConsentWhatsApp: { type: Boolean, default: false },
    marketingConsentWhatsAppAt: { type: Date, default: null },
    marketingConsentSource: {
      type: String,
      enum: [
        "account_creation",
        "account_preferences",
        "checkout",
        "register",
        "unsubscribe_page",
        "whatsapp_reply",
        "sms_reply",
        null
      ],
      default: null
    },
    legal: { type: legalConsentSchema, default: () => ({}) },
    marketing: { type: marketingConsentSchema, default: () => ({}) },
    savedDetails: { type: savedDetailsSchema, default: () => ({}) },
    customerClub: { type: customerClubSchema, default: () => ({}) },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER
    },
    addresses: { type: [addressSchema], default: [] },
    defaultAddressId: { type: mongoose.Schema.Types.ObjectId, default: null },
    favoriteProductIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      default: []
    },
    preferredLanguage: {
      type: String,
      enum: ["he", "ar", "en", null],
      default: null
    },
    isActive: { type: Boolean, default: true },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
