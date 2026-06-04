/**
 * Helpers that decide whether a customer may receive a given type of message.
 *
 * Two clearly separated channels:
 *  - Service / order messages: tied to an active order (confirmation, delivery
 *    updates, missing items, replacements, refunds, coordination). These may be
 *    sent regardless of marketing consent.
 *  - Marketing messages: promotions, coupons, campaigns, "today's deals", etc.
 *    Only allowed when the customer has active marketing consent.
 */

/**
 * Read marketing consent in a way that supports both the legacy flat fields
 * (marketingConsentWhatsApp / ...At) and the structured `marketing` subdocument.
 *
 * @param {object} customer User document or plain object
 * @returns {{ consent: boolean, unsubscribedAt: Date|null }}
 */
const readMarketingState = (customer) => {
  if (!customer || typeof customer !== "object") {
    return { consent: false, unsubscribedAt: null };
  }

  const structured = customer.marketing || {};
  const structuredConsent =
    typeof structured.consent === "boolean" ? structured.consent : null;
  const legacyConsent = customer.marketingConsentWhatsApp === true;

  const consent = structuredConsent === null ? legacyConsent : structuredConsent;
  const unsubscribedAt = structured.unsubscribedAt || null;

  return { consent: Boolean(consent), unsubscribedAt };
};

/**
 * True only when marketing consent is active.
 * Requires consent === true AND no unsubscribedAt timestamp.
 *
 * @param {object} customer
 * @returns {boolean}
 */
const canReceiveMarketing = (customer) => {
  const { consent, unsubscribedAt } = readMarketingState(customer);
  if (!consent) return false;
  if (unsubscribedAt) return false;
  return true;
};

/**
 * True for order/service related messages. These are needed for handling an
 * order and are independent of marketing consent. Returns true whenever there
 * is an order or customer context to message about.
 *
 * @param {object} [orderOrCustomer]
 * @returns {boolean}
 */
const canReceiveServiceMessages = (orderOrCustomer) => Boolean(orderOrCustomer);

/**
 * Mongoose-style filter for selecting customers eligible for marketing.
 * Supports both legacy and structured consent fields via $or.
 */
const marketingEligibleQuery = () => ({
  $and: [
    {
      $or: [
        { "marketing.consent": true },
        {
          marketingConsentWhatsApp: true,
          "marketing.consent": { $ne: false }
        }
      ]
    },
    {
      $or: [
        { "marketing.unsubscribedAt": null },
        { "marketing.unsubscribedAt": { $exists: false } }
      ]
    }
  ]
});

module.exports = {
  readMarketingState,
  canReceiveMarketing,
  canReceiveServiceMessages,
  marketingEligibleQuery
};
