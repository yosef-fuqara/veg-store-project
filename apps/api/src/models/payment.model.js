const mongoose = require("mongoose");

const PAYMENT_SOURCE = {
  WEBHOOK: "webhook",
  ADMIN: "admin"
};

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    provider: { type: String, required: true, trim: true },
    providerEventId: { type: String, trim: true, sparse: true },
    source: {
      type: String,
      enum: Object.values(PAYMENT_SOURCE),
      required: true
    },
    outcome: { type: String, trim: true },
    amountSnapshot: { type: Number, min: 0 },
    currency: { type: String, trim: true, default: "ILS", uppercase: true },
    rawPayload: { type: mongoose.Schema.Types.Mixed },
    processedAt: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 2000 }
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1, createdAt: -1 });
paymentSchema.index(
  { provider: 1, providerEventId: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
module.exports.PAYMENT_SOURCE = PAYMENT_SOURCE;
