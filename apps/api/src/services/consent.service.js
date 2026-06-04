/**
 * Shared consent helpers used by register, checkout (order creation) and account
 * preference endpoints. Centralizes how we persist legal acceptance, marketing
 * consent, saved-details consent and customer-club membership so versions and
 * snapshots stay consistent (Part 11/12/13).
 */
const { LEGAL_VERSIONS, normalizeConsentLanguage } = require("../constants/legal-versions");

/** Best-effort client IP (works with/without a trusting proxy). */
const getRequestIp = (req) => {
  if (!req) return null;
  const fwd = req.headers?.["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) {
    return fwd.split(",")[0].trim().slice(0, 64);
  }
  const ip = req.ip || req.socket?.remoteAddress || null;
  return ip ? String(ip).slice(0, 64) : null;
};

const getRequestUserAgent = (req) => {
  const ua = req?.headers?.["user-agent"];
  return typeof ua === "string" ? ua.slice(0, 512) : null;
};

const coerceBool = (value) => value === true || value === "true";

/**
 * Build the order legal snapshot from the request body + meta.
 * `body` is expected to carry consent fields (see order validator).
 * For logged-in checkout without a checkbox, pass `user` and use acceptedFrom "logged_in_user".
 */
const buildOrderLegalSnapshot = (req, { acceptedFrom = "checkout", user = null } = {}) => {
  const body = req.body || {};
  const acceptedLanguage =
    normalizeConsentLanguage(body.consentLanguage) ||
    normalizeConsentLanguage(req.headers?.["x-app-language"]);
  const termsAcceptedFromCheckout = coerceBool(body.acceptTerms);
  const termsAcceptedFromAccount = Boolean(user?.legal?.acceptedTerms);
  const termsAccepted =
    termsAcceptedFromCheckout || termsAcceptedFromAccount || Boolean(user);
  const snapshotAcceptedFrom =
    user && !termsAcceptedFromCheckout ? "logged_in_user" : acceptedFrom;

  return {
    termsAccepted,
    termsVersion: LEGAL_VERSIONS.TERMS_VERSION,
    privacyVersion: LEGAL_VERSIONS.PRIVACY_VERSION,
    shippingPolicyVersion: LEGAL_VERSIONS.SHIPPING_POLICY_VERSION,
    cancellationPolicyVersion: LEGAL_VERSIONS.CANCELLATION_POLICY_VERSION,
    customerClubTermsVersion: coerceBool(body.joinCustomerClub)
      ? LEGAL_VERSIONS.CUSTOMER_CLUB_TERMS_VERSION
      : null,
    marketingConsentAtOrderTime: coerceBool(body.marketingConsent),
    saveDetailsConsentAtOrderTime: coerceBool(body.saveDetailsConsent),
    customerClubJoinedAtOrderTime: coerceBool(body.joinCustomerClub),
    acceptedAt: new Date(),
    acceptedFrom: snapshotAcceptedFrom,
    acceptedLanguage,
    ipAddress: getRequestIp(req),
    userAgent: getRequestUserAgent(req)
  };
};

/**
 * Apply marketing consent to a user document (structured + legacy mirror).
 * @param {object} user mongoose user
 * @param {boolean} consent
 * @param {object} meta { source, language, channels }
 */
const applyMarketingConsent = (user, consent, meta = {}) => {
  const enabled = consent === true;
  const language = normalizeConsentLanguage(meta.language);
  const now = new Date();

  user.marketing = user.marketing || {};
  user.marketing.consent = enabled;
  user.marketing.consentAt = enabled ? now : user.marketing.consentAt || null;
  user.marketing.consentSource = meta.source || user.marketing.consentSource || null;
  user.marketing.consentTextVersion = enabled
    ? LEGAL_VERSIONS.MARKETING_CONSENT_TEXT_VERSION
    : user.marketing.consentTextVersion || null;
  user.marketing.consentLanguage = enabled
    ? language || user.marketing.consentLanguage || null
    : user.marketing.consentLanguage || null;

  const channels = meta.channels || {};
  user.marketing.channels = {
    whatsapp: enabled ? channels.whatsapp ?? true : false,
    sms: enabled ? channels.sms ?? false : false,
    email: enabled ? channels.email ?? false : false
  };

  if (enabled) {
    user.marketing.unsubscribedAt = null;
    user.marketing.unsubscribeSource = null;
  }

  // Legacy mirror used by existing admin marketing tooling.
  user.marketingConsentWhatsApp = enabled;
  user.marketingConsentWhatsAppAt = enabled ? now : null;
  user.marketingConsentSource = enabled ? meta.source || "account_preferences" : null;
};

/** Record a marketing unsubscribe (does not touch service messaging). */
const applyMarketingUnsubscribe = (user, { source } = {}) => {
  const now = new Date();
  user.marketing = user.marketing || {};
  user.marketing.consent = false;
  user.marketing.unsubscribedAt = now;
  user.marketing.unsubscribeSource = source || "unsubscribe_page";
  user.marketing.channels = { whatsapp: false, sms: false, email: false };

  user.marketingConsentWhatsApp = false;
  user.marketingConsentWhatsAppAt = null;
  user.marketingConsentSource = source || "unsubscribe_page";
};

/** Record legal acceptance on a user (terms/privacy/shipping/cancellation). */
const applyLegalAcceptance = (user, { from, language, ipAddress, userAgent } = {}) => {
  user.legal = user.legal || {};
  user.legal.acceptedTerms = true;
  user.legal.acceptedTermsAt = new Date();
  user.legal.acceptedTermsVersion = LEGAL_VERSIONS.TERMS_VERSION;
  user.legal.acceptedPrivacyVersion = LEGAL_VERSIONS.PRIVACY_VERSION;
  user.legal.acceptedShippingPolicyVersion = LEGAL_VERSIONS.SHIPPING_POLICY_VERSION;
  user.legal.acceptedCancellationPolicyVersion = LEGAL_VERSIONS.CANCELLATION_POLICY_VERSION;
  user.legal.acceptedFrom = from || user.legal.acceptedFrom || null;
  user.legal.acceptedLanguage = normalizeConsentLanguage(language) || user.legal.acceptedLanguage || null;
  if (ipAddress) user.legal.ipAddress = ipAddress;
  if (userAgent) user.legal.userAgent = userAgent;
};

/** Join the customer club. */
const applyCustomerClubJoin = (user, { language } = {}) => {
  user.customerClub = user.customerClub || {};
  user.customerClub.joined = true;
  user.customerClub.joinedAt = user.customerClub.joinedAt || new Date();
  user.customerClub.termsVersion = LEGAL_VERSIONS.CUSTOMER_CLUB_TERMS_VERSION;
  user.customerClub.joinedLanguage =
    normalizeConsentLanguage(language) || user.customerClub.joinedLanguage || null;
  user.customerClub.leftAt = null;
  user.customerClub.status = "active";
};

/** Leave the customer club (order data is retained elsewhere). */
const applyCustomerClubLeave = (user) => {
  user.customerClub = user.customerClub || {};
  user.customerClub.joined = false;
  user.customerClub.leftAt = new Date();
  user.customerClub.status = "left";
};

const applySavedDetailsConsent = (user, enabled) => {
  user.savedDetails = user.savedDetails || {};
  user.savedDetails.saveForNextOrder = enabled === true;
  user.savedDetails.savedAt = enabled === true ? new Date() : null;
};

module.exports = {
  getRequestIp,
  getRequestUserAgent,
  coerceBool,
  buildOrderLegalSnapshot,
  applyMarketingConsent,
  applyMarketingUnsubscribe,
  applyLegalAcceptance,
  applyCustomerClubJoin,
  applyCustomerClubLeave,
  applySavedDetailsConsent
};
