/**
 * Marketing unsubscribe logic shared by the public unsubscribe page and the
 * inbound WhatsApp/SMS webhook. Only marketing/promotional messaging is
 * affected — service/order messages are never disabled here.
 */
const User = require("../models/user.model");
const { normalizeIsraeliMobile } = require("../utils/israeliMobilePhone");
const { applyMarketingUnsubscribe } = require("./consent.service");

const VALID_SOURCES = new Set(["unsubscribe_page", "whatsapp_reply", "sms_reply"]);

/**
 * Unsubscribe a customer from marketing by phone and/or email.
 * Always returns success-shaped data (no account enumeration): the caller does
 * not learn whether a matching record existed.
 *
 * @param {{ phone?: string, email?: string, source?: string }} params
 * @returns {Promise<{ matched: number }>}
 */
const unsubscribeMarketing = async ({ phone, email, source } = {}) => {
  const safeSource = VALID_SOURCES.has(source) ? source : "unsubscribe_page";

  const or = [];
  const normalizedPhone = phone ? normalizeIsraeliMobile(String(phone).trim()) : null;
  if (normalizedPhone) or.push({ phone: normalizedPhone });
  const normalizedEmail = email ? String(email).toLowerCase().trim() : null;
  if (normalizedEmail) or.push({ email: normalizedEmail });

  if (!or.length) {
    return { matched: 0 };
  }

  const users = await User.find({ $or: or });
  let matched = 0;
  for (const user of users) {
    applyMarketingUnsubscribe(user, { source: safeSource });
    // eslint-disable-next-line no-await-in-loop
    await user.save();
    matched += 1;
  }

  return { matched };
};

module.exports = { unsubscribeMarketing, VALID_SOURCES };
