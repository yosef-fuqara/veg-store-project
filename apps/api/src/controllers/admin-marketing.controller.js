const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model");
const MarketingCampaign = require("../models/marketing-campaign.model");
const AppError = require("../utils/app-error");
const { USER_ROLES } = require("../constants/roles");
const { sendTransactionalWhatsAppToCustomer } = require("../services/whatsapp.service");
const { buildMarketingWhatsAppMessage } = require("../utils/marketing-whatsapp-message");
const { marketingEligibleQuery } = require("../utils/marketing-eligibility");

// Only customers with active marketing consent (and not unsubscribed) receive
// marketing. Combines the legacy flag with the structured marketing subdocument.
const RECIPIENT_FILTER = {
  role: USER_ROLES.CUSTOMER,
  ...marketingEligibleQuery()
};

const MARKETING_CHANNEL = "whatsapp";

const normalizeMessage = (value) => String(value || "").trim();

const getMarketingRecipientsCount = async (_req, res, next) => {
  try {
    const recipientCount = await User.countDocuments(RECIPIENT_FILTER);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: { recipientCount }
    });
  } catch (error) {
    return next(error);
  }
};

const previewMarketingCampaign = async (req, res, next) => {
  try {
    const recipientCount = await User.countDocuments(RECIPIENT_FILTER);
    const previewMessage = buildMarketingWhatsAppMessage({
      title: req.body.title,
      message: req.body.message
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        title: normalizeMessage(req.body.title),
        channel: MARKETING_CHANNEL,
        recipientCount,
        previewMessage
      }
    });
  } catch (error) {
    return next(error);
  }
};

const sendMarketingCampaign = async (req, res, next) => {
  try {
    const title = normalizeMessage(req.body.title);
    const body = normalizeMessage(req.body.message);
    const message = buildMarketingWhatsAppMessage({ title, message: body });
    const recipients = await User.find(RECIPIENT_FILTER).select("phone").lean();
    const recipientCount = recipients.length;

    if (recipientCount === 0) {
      throw new AppError(
        "No marketing recipients available. Campaign was not sent.",
        StatusCodes.BAD_REQUEST
      );
    }

    const campaign = await MarketingCampaign.create({
      title,
      message,
      channel: MARKETING_CHANNEL,
      recipientCount,
      sentBy: req.user?._id || null,
      status: "draft",
      failedRecipients: 0
    });

    let failedRecipients = 0;

    for (const recipient of recipients) {
      try {
        const result = await sendTransactionalWhatsAppToCustomer({
          customerPhone: recipient.phone,
          message
        });
        if (!result?.ok) {
          failedRecipients += 1;
        }
      } catch (_error) {
        failedRecipients += 1;
      }
    }

    const status = failedRecipients >= recipientCount ? "failed" : "sent";
    campaign.failedRecipients = failedRecipients;
    campaign.status = status;
    campaign.sentAt = new Date();
    await campaign.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: status === "sent" ? "Campaign sent." : "Campaign completed with failures.",
      data: {
        campaign: {
          id: campaign._id,
          title: campaign.title,
          channel: campaign.channel,
          recipientCount: campaign.recipientCount,
          failedRecipients: campaign.failedRecipients,
          status: campaign.status,
          sentAt: campaign.sentAt
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMarketingRecipientsCount,
  previewMarketingCampaign,
  sendMarketingCampaign
};
