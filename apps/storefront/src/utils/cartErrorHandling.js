/**
 * Cart / API errors that should never be shown verbatim to shoppers.
 */
import i18n from "../i18n";

const TECHNICAL_CART_MESSAGE =
  /\bunauthenticated\b|\bunauthorized\b|\bbad_request\b|\[unauthenticated\]|\[bad_request\]/i;

/** Stable API `code` values from {@link AppError} (cart) → full i18n keys. */
const CART_BUSINESS_ERROR_I18N_KEYS = {
  CART_ADD_AMOUNT_BLOCKED_QUANTITY_LINE: "cart:errors.addByAmountBlockedQuantityLine",
  CART_ADD_QUANTITY_BLOCKED_AMOUNT_LINE: "cart:errors.addByQuantityBlockedAmountLine",
  CART_UPDATE_QUANTITY_BLOCKED_AMOUNT_LINE: "cart:errors.updateQuantityBlockedAmountLine",
  CART_UPDATE_AMOUNT_BLOCKED_QUANTITY_LINE: "cart:errors.updateAmountBlockedQuantityLine"
};

/**
 * @param {unknown} err
 * @returns {string | null}
 */
export function translateCartBusinessError(err) {
  if (!err || typeof err !== "object") return null;
  const response =
    /** @type {{ response?: { data?: { code?: string } } }} */ (err).response;
  const code = response?.data?.code;
  if (typeof code !== "string") return null;
  const i18nKey = CART_BUSINESS_ERROR_I18N_KEYS[code];
  if (!i18nKey) return null;
  return i18n.t(i18nKey);
}

/**
 * @param {unknown} err
 * @returns {boolean}
 */
export function isCartAuthError(err) {
  if (!err || typeof err !== "object") return false;
  const response =
    /** @type {{ response?: { status?: number; data?: { code?: string; message?: string } } }} */ (err).response;
  if (response?.status === 401) return true;

  const code = response?.data?.code;
  if (typeof code === "string" && code.toUpperCase() === "UNAUTHENTICATED") return true;

  const dataMsg = response?.data?.message;
  const userMsg = /** @type {{ userMessage?: string }} */ (err).userMessage;
  const combined = `${typeof userMsg === "string" ? userMsg : ""} ${typeof dataMsg === "string" ? dataMsg : ""}`;
  return TECHNICAL_CART_MESSAGE.test(combined);
}

/**
 * @param {string} message
 * @returns {boolean}
 */
export function isTechnicalCustomerCartMessage(message) {
  if (!message || typeof message !== "string") return true;
  return TECHNICAL_CART_MESSAGE.test(message.trim());
}
