const WHATSAPP_UNSUBSCRIBE = "To unsubscribe, reply STOP.";

const normalizePart = (value) => String(value || "").trim();

/**
 * Builds the exact WhatsApp marketing text (title, body, unsubscribe footer).
 * @param {{ title?: string, message: string }} params
 * @returns {string}
 */
function buildMarketingWhatsAppMessage({ title, message }) {
  const body = normalizePart(message);
  const trimmedTitle = normalizePart(title);
  const coreMessage = trimmedTitle ? `*${trimmedTitle}*\n\n${body}` : body;
  return `${coreMessage}\n\n${WHATSAPP_UNSUBSCRIBE}`;
}

module.exports = {
  WHATSAPP_UNSUBSCRIBE,
  buildMarketingWhatsAppMessage
};
