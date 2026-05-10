const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/app-error");

/** Business village — lower free-delivery threshold + ₪10 fee below minimum. */
const LOCAL_DELIVERY_AREA = "buaine_nujeidat";

const LOCAL_FREE_DELIVERY_MIN = 100;
const OUTSIDE_FREE_DELIVERY_MIN = 200;
const LOCAL_DELIVERY_FEE = 10;
const OUTSIDE_DELIVERY_FEE = 30;

/**
 * Supported delivery destinations. `key` is stored on orders; `names` are for display only.
 * @type {Array<{ key: string, names: { ar: string, he: string, en: string }, isLocal: boolean }>}
 */
const ALLOWED_DELIVERY_AREAS = [
  {
    key: "buaine_nujeidat",
    names: { he: "בועיינה נוג׳ידאת", ar: "بُعينة-نُجيدات", en: "Bu'eine Nujeidat" },
    isLocal: true
  },
  {
    key: "turan",
    names: { he: "טורעאן", ar: "طرعان", en: "Tur'an" },
    isLocal: false
  },
  {
    key: "eilabun",
    names: { he: "עילבון", ar: "عيلبون", en: "Eilabun" },
    isLocal: false
  },
  {
    key: "deir_hanna",
    names: { he: "דיר חנא", ar: "دير حنا", en: "Deir Hanna" },
    isLocal: false
  },
  {
    key: "arraba",
    names: { he: "עראבה", ar: "عرابة", en: "Arraba" },
    isLocal: false
  },
  {
    key: "sakhnin",
    names: { he: "סחנין", ar: "سخنين", en: "Sakhnin" },
    isLocal: false
  },
  {
    key: "kafr_kanna",
    names: { he: "כפר כנא", ar: "كفر كنا", en: "Kafr Kanna" },
    isLocal: false
  },
  {
    key: "wadi_al_hamam",
    names: { he: "ואדי אל חמאם", ar: "وادي الحمام", en: "Wadi al-Hamam" },
    isLocal: false
  },
  {
    key: "maghar",
    names: { he: "מגאר", ar: "المغار", en: "Maghar" },
    isLocal: false
  },
  {
    key: "izeir",
    names: { he: "עוזיר", ar: "أوزير", en: "Izeir" },
    isLocal: false
  },
  {
    key: "arab_al_heeb",
    names: { he: "ערב אל-היב", ar: "عرب الهيب", en: "Arab al-Heeb" },
    isLocal: false
  },
  {
    key: "rummana",
    names: { he: "רומאנה", ar: "الرمانة", en: "Rummana" },
    isLocal: false
  }
];

/** Former `deliveryArea` keys — display / notifications only; not valid for new orders. */
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

const ALLOWED_DELIVERY_AREA_KEYS = ALLOWED_DELIVERY_AREAS.map((a) => a.key);

const getDeliveryArea = (areaKey) =>
  ALLOWED_DELIVERY_AREAS.find((a) => a.key === areaKey) || null;

const isLocalDeliveryArea = (areaKey) => areaKey === LOCAL_DELIVERY_AREA;

const isAllowedDeliveryArea = (areaKey) =>
  typeof areaKey === "string" && ALLOWED_DELIVERY_AREA_KEYS.includes(areaKey);

const pickLocalizedName = (names, preferredLang) => {
  if (!names || typeof names !== "object") return "";
  const short =
    preferredLang && String(preferredLang).trim()
      ? String(preferredLang).split("-")[0].toLowerCase()
      : "";
  const get = (k) => (typeof names[k] === "string" ? names[k].trim() : "");
  if (short && get(short)) return get(short);
  return get("he") || get("ar") || get("en") || "";
};

/**
 * Human-readable delivery area for UI/notifications (current + legacy keys).
 * @param {string} [areaKey]
 * @param {string} [snapshotCity] - `deliveryAddress.city` from the order
 * @param {string} [preferredLang] - `he` | `ar` | `en`
 */
const resolveDeliveryAreaLabel = (areaKey, snapshotCity, preferredLang) => {
  const area = getDeliveryArea(areaKey);
  if (area?.names) {
    const label = pickLocalizedName(area.names, preferredLang);
    if (label) return label;
  }
  const legacy = areaKey ? LEGACY_DELIVERY_AREA_LABELS[areaKey] : null;
  if (legacy) {
    const label = pickLocalizedName(legacy, preferredLang);
    if (label) return label;
  }
  if (typeof snapshotCity === "string" && snapshotCity.trim()) {
    return snapshotCity.trim();
  }
  if (typeof areaKey === "string" && areaKey.trim()) return areaKey.trim();
  return "—";
};

/** Canonical snapshot for `deliveryAddress.city` on new orders (Hebrew-first). */
const snapshotCityForOrder = (area) => {
  if (!area?.names) return "";
  return (
    pickLocalizedName(area.names, "he") ||
    pickLocalizedName(area.names, "ar") ||
    pickLocalizedName(area.names, "en")
  );
};

const calculateDeliveryFee = (areaKey, subtotal) => {
  if (!isAllowedDeliveryArea(areaKey)) {
    throw new AppError(
      "Unsupported delivery area",
      StatusCodes.BAD_REQUEST
    );
  }

  const numericSubtotal = Number(subtotal);
  if (!Number.isFinite(numericSubtotal) || numericSubtotal < 0) {
    throw new AppError("Invalid subtotal", StatusCodes.BAD_REQUEST);
  }

  if (isLocalDeliveryArea(areaKey)) {
    return numericSubtotal >= LOCAL_FREE_DELIVERY_MIN ? 0 : LOCAL_DELIVERY_FEE;
  }

  return numericSubtotal >= OUTSIDE_FREE_DELIVERY_MIN ? 0 : OUTSIDE_DELIVERY_FEE;
};

module.exports = {
  LOCAL_DELIVERY_AREA,
  ALLOWED_DELIVERY_AREAS,
  ALLOWED_DELIVERY_AREA_KEYS,
  LEGACY_DELIVERY_AREA_LABELS,
  LOCAL_FREE_DELIVERY_MIN,
  OUTSIDE_FREE_DELIVERY_MIN,
  LOCAL_DELIVERY_FEE,
  OUTSIDE_DELIVERY_FEE,
  getDeliveryArea,
  isLocalDeliveryArea,
  isAllowedDeliveryArea,
  calculateDeliveryFee,
  pickLocalizedName,
  resolveDeliveryAreaLabel,
  snapshotCityForOrder
};
