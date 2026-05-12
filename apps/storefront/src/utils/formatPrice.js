const localeForLang = (lang) => {
  switch (lang) {
    case "he":
      return "he-IL";
    case "ar":
      return "ar";
    case "en":
    default:
      return "en-US";
  }
};

/**
 * Format amount as ILS for the given UI language.
 * @param {number} amount
 * @param {string} lang - 'he' | 'ar' | 'en'
 */
export function formatPrice(amount, lang = "he") {
  const n = Number(amount);
  if (Number.isNaN(n)) return "";
  const locale = localeForLang(lang);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "ILS"
    }).format(n);
  } catch {
    return `${n} ₪`;
  }
}

/**
 * Whole-shekel display for charged totals (floor; no agorot).
 * Use for line totals, cart/checkout/order summaries — not for unit catalog prices.
 */
export function formatChargedTotal(amount, lang = "he") {
  const n = Number(amount);
  if (Number.isNaN(n)) return "";
  const whole = Math.floor(n);
  const locale = localeForLang(lang);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(whole);
  } catch {
    return `${whole} ₪`;
  }
}
