/**
 * Single source of truth for legal/consent document versions.
 *
 * Bump the relevant value (use the publish date, e.g. "2026-06-04") whenever the
 * corresponding customer-facing document changes. Consent snapshots persisted on
 * users and orders reference these versions so we always know which text a
 * customer agreed to. Never hardcode version strings elsewhere — import here.
 */
const LEGAL_VERSIONS = Object.freeze({
  TERMS_VERSION: "2026-06-04",
  PRIVACY_VERSION: "2026-06-04",
  SHIPPING_POLICY_VERSION: "2026-06-04",
  CANCELLATION_POLICY_VERSION: "2026-06-04",
  ACCESSIBILITY_STATEMENT_VERSION: "2026-06-04",
  CUSTOMER_CLUB_TERMS_VERSION: "2026-06-04",
  MARKETING_CONSENT_TEXT_VERSION: "2026-06-04"
});

const CONSENT_LANGUAGES = Object.freeze(["he", "ar", "en"]);

/** Normalize an arbitrary language tag to one of the supported consent languages. */
const normalizeConsentLanguage = (value) => {
  const base = String(value || "")
    .split("-")[0]
    .toLowerCase();
  return CONSENT_LANGUAGES.includes(base) ? base : null;
};

module.exports = {
  LEGAL_VERSIONS,
  CONSENT_LANGUAGES,
  normalizeConsentLanguage,
  ...LEGAL_VERSIONS
};
