/** Retired `deliveryArea` keys — matches API legacy map for offline admin display. */
const LEGACY_DELIVERY_AREA_LABELS = {
  kafr_manda: {
    he: "כפר מנדא",
    ar: "كفر مندا",
    en: "Kafr Manda"
  },
  mashhad: {
    he: "משהד",
    ar: "المشهد",
    en: "Mashhad"
  },
  nazareth: {
    he: "נצרת",
    ar: "الناصرة",
    en: "Nazareth"
  }
};

const pick = (names, lang) => {
  if (!names || typeof names !== "object") return "";
  const short = lang ? String(lang).split("-")[0].toLowerCase() : "";
  const get = (k) => (typeof names[k] === "string" ? names[k].trim() : "");
  if (short && get(short)) return get(short);
  return get("he") || get("ar") || get("en") || "";
};

/**
 * @param {object} order
 * @param {Array<{ key: string, names?: { ar?: string, he?: string, en?: string } }>} [areasList] - from GET /orders/delivery-areas
 */
export function resolveAdminDeliveryAreaLabel(order, areasList) {
  const key = order?.deliveryArea || order?.deliveryZone;
  const city = order?.deliveryAddress?.city;
  const lang = "en";

  const list = Array.isArray(areasList) ? areasList : [];
  const hit = list.find((a) => a.key === key);
  if (hit?.names) {
    const n = pick(hit.names, lang);
    if (n) return n;
  }

  const legacy = key ? LEGACY_DELIVERY_AREA_LABELS[key] : null;
  if (legacy) {
    const n = pick(legacy, lang);
    if (n) return n;
  }

  if (typeof city === "string" && city.trim()) return city.trim();
  if (typeof key === "string" && key.trim()) return key.trim();
  return "—";
}
