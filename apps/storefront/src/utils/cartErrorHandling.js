/**
 * Cart / API errors that should never be shown verbatim to shoppers.
 */
const TECHNICAL_CART_MESSAGE =
  /\bunauthenticated\b|\bunauthorized\b|\bbad_request\b|\[unauthenticated\]|\[bad_request\]/i;

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
