/**
 * Storefront mirror of the API legal version constants. Sent with consent
 * actions so the captured version matches the text the customer saw.
 * Keep in sync with apps/api/src/constants/legal-versions.js.
 */
export const LEGAL_VERSIONS = Object.freeze({
  TERMS_VERSION: "2026-06-04",
  PRIVACY_VERSION: "2026-06-04",
  SHIPPING_POLICY_VERSION: "2026-06-04",
  CANCELLATION_POLICY_VERSION: "2026-06-04",
  ACCESSIBILITY_STATEMENT_VERSION: "2026-06-04",
  CUSTOMER_CLUB_TERMS_VERSION: "2026-06-04",
  MARKETING_CONSENT_TEXT_VERSION: "2026-06-04"
});

/** Routes for the legal pages, used by footer + consent links. */
export const LEGAL_ROUTES = Object.freeze({
  terms: "/terms",
  privacy: "/privacy",
  shipping: "/shipping-policy",
  cancellation: "/cancellation-policy",
  accessibility: "/accessibility",
  unsubscribe: "/unsubscribe",
  customerClub: "/customer-club"
});
