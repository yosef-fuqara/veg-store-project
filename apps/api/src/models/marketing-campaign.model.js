const mongoose = require("mongoose");

const marketingCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160, default: "" },
    message: { type: String, required: true, trim: true, maxlength: 4500 },
    channel: {
      type: String,
      required: true,
      enum: ["whatsapp"],
      default: "whatsapp"
    },
    recipientCount: { type: Number, required: true, min: 0, default: 0 },
    sentAt: { type: Date, default: null },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      required: true,
      enum: ["draft", "sent", "failed"],
      default: "draft"
    },
    failedRecipients: { type: Number, required: true, min: 0, default: 0 }
  },
  { timestamps: true }
);

marketingCampaignSchema.index({ sentAt: -1 });
marketingCampaignSchema.index({ status: 1, sentAt: -1 });

module.exports = mongoose.model("MarketingCampaign", marketingCampaignSchema);
