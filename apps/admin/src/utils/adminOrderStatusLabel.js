import i18n from "../i18n";

/**
 * Translates an order status enum value to a human-readable label using
 * the current admin language. Backend values are never modified.
 */
export function formatAdminOrderStatusLabel(status) {
  if (!status) return "—";
  const t = i18n.getFixedT(null, "orders");
  const key = `orderStatuses.${status}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return String(status).replaceAll("_", " ");
}

/**
 * Translates a payment status enum value to a human-readable label.
 */
export function formatAdminPaymentStatusLabel(status) {
  if (!status) return "—";
  const t = i18n.getFixedT(null, "orders");
  const key = `paymentStatuses.${status}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return String(status).replaceAll("_", " ");
}
