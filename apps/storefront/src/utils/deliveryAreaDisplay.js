import {
  ALLOWED_DELIVERY_AREAS,
  LEGACY_DELIVERY_AREA_LABELS
} from "../config/delivery";

const pick = (names, lang) => {
  if (!names || typeof names !== "object") return "";
  const short = lang ? String(lang).split("-")[0].toLowerCase() : "";
  const get = (k) => (typeof names[k] === "string" ? names[k].trim() : "");
  if (short && get(short)) return get(short);
  return get("he") || get("ar") || get("en") || "";
};

/**
 * @param {object} area - API or fallback area `{ key, names?, label? }`
 * @param {string} lang
 * @param {(key: string, opts?: object) => string} [t] - i18n `t` for namespace with `areas.*`
 */
export function deliveryAreaOptionLabel(area, lang, t) {
  const names = area?.names;
  if (names && typeof names === "object") {
    const fromNames = pick(names, lang);
    if (fromNames) return fromNames;
  }
  if (typeof area?.label === "string" && area.label.trim()) return area.label.trim();
  const key = area?.key;
  if (key && typeof t === "function") {
    const tr = t(`areas.${key}`, { defaultValue: "" });
    if (tr && tr !== `areas.${key}`) return tr;
  }
  return key || "";
}

/**
 * @param {object} order
 * @param {(key: string, opts?: object) => string} tCheckout - `useTranslation('checkout').t`
 * @param {string} lang
 */
export function formatOrderDeliveryAreaLabel(order, tCheckout, lang) {
  const key = order?.deliveryArea || order?.deliveryZone;
  const city = order?.deliveryAddress?.city;
  if (!key) {
    return typeof city === "string" && city.trim() ? city.trim() : "—";
  }
  if (typeof tCheckout === "function") {
    const tr = tCheckout(`areas.${key}`, { defaultValue: "" });
    if (tr && tr !== `areas.${key}`) return tr;
  }
  const current = ALLOWED_DELIVERY_AREAS.find((a) => a.key === key);
  if (current?.names) {
    const n = pick(current.names, lang);
    if (n) return n;
  }
  const legacy = LEGACY_DELIVERY_AREA_LABELS[key];
  if (legacy) {
    const n = pick(legacy, lang);
    if (n) return n;
  }
  if (typeof city === "string" && city.trim()) return city.trim();
  return key;
}
