const Joi = require("joi");

const campaignPayload = {
  title: Joi.string().trim().max(160).allow("").default(""),
  message: Joi.string().trim().min(1).max(4000).required()
};

const previewMarketingCampaignSchema = Joi.object(campaignPayload);
const sendMarketingCampaignSchema = Joi.object(campaignPayload);

module.exports = {
  previewMarketingCampaignSchema,
  sendMarketingCampaignSchema
};
