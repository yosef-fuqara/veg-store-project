import { getAccessToken } from "../services/authStorage";
import { loadPersistedCartLines } from "./vegstorePersistence";

/** First add-to-cart nudge — once per session. */
export const GUEST_ACCOUNT_PROMPT_SESSION_KEY = "vegstore.guestAccountPromptDismissed";

/** Checkout nudge — separate so dismissing the add-to-cart prompt does not skip checkout. */
export const GUEST_CHECKOUT_PROMPT_SESSION_KEY = "vegstore.guestCheckoutPromptDismissed";

function readSessionFlag(key) {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeSessionFlag(key) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    /* sessionStorage unavailable — fail open */
  }
}

export function isGuestAccountPromptDismissed() {
  return readSessionFlag(GUEST_ACCOUNT_PROMPT_SESSION_KEY);
}

export function markGuestAccountPromptDismissed() {
  writeSessionFlag(GUEST_ACCOUNT_PROMPT_SESSION_KEY);
}

export function isGuestCheckoutPromptDismissed() {
  return readSessionFlag(GUEST_CHECKOUT_PROMPT_SESSION_KEY);
}

export function markGuestCheckoutPromptDismissed() {
  writeSessionFlag(GUEST_CHECKOUT_PROMPT_SESSION_KEY);
}

/** True when the shopper is not authenticated (token is source of truth). */
export function isGuestShopper() {
  return !getAccessToken();
}

/**
 * True when a guest has no items in cart state or persisted guest lines
 * (first add-to-cart in this visit).
 */
export function isGuestCartEmptyForPrompt(cartItems) {
  if (!isGuestShopper()) return false;
  const count = Array.isArray(cartItems) ? cartItems.length : 0;
  if (count > 0) return false;
  return loadPersistedCartLines().length === 0;
}
