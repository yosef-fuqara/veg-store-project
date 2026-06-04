/**
 * Keywords that, when received as an inbound WhatsApp/SMS reply, mean the
 * customer wants to stop marketing messages. Service/order messages are never
 * affected by these keywords.
 *
 * Matching is case-insensitive and ignores surrounding whitespace/punctuation.
 */
const UNSUBSCRIBE_KEYWORDS = Object.freeze([
  // Hebrew
  "הסר",
  "הסרה",
  // Arabic
  "إلغاء",
  "الغاء",
  "إلغاء الاشتراك",
  "الغاء الاشتراك",
  // English
  "stop",
  "unsubscribe"
]);

const normalizeKeyword = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    // strip common leading/trailing punctuation but keep internal spaces
    .replace(/^[\s.,!?؟"'’“”]+|[\s.,!?؟"'’“”]+$/g, "");

/**
 * @param {string} text raw inbound message body
 * @returns {boolean} true if the message is an unsubscribe request
 */
const isUnsubscribeMessage = (text) => {
  const normalized = normalizeKeyword(text);
  if (!normalized) return false;
  return UNSUBSCRIBE_KEYWORDS.some((keyword) => normalizeKeyword(keyword) === normalized);
};

module.exports = {
  UNSUBSCRIBE_KEYWORDS,
  normalizeKeyword,
  isUnsubscribeMessage
};
