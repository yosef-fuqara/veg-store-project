// Mirror of backend delivery rules. The backend remains the source of truth;
// these constants are used as a fallback when the API is unavailable.

export const LOCAL_DELIVERY_AREA = "buaine_nujeidat";

export const LOCAL_FREE_DELIVERY_MIN = 100;
export const OUTSIDE_FREE_DELIVERY_MIN = 200;
export const LOCAL_DELIVERY_FEE = 10;
export const OUTSIDE_DELIVERY_FEE = 30;

export const ALLOWED_DELIVERY_AREAS = [
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

/** Retired keys — display fallback only. */
export const LEGACY_DELIVERY_AREA_LABELS = {
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

export const estimateDeliveryFee = (areaKey, subtotal, rules) => {
  const r = rules || {
    localFreeDeliveryMin: LOCAL_FREE_DELIVERY_MIN,
    outsideFreeDeliveryMin: OUTSIDE_FREE_DELIVERY_MIN,
    localDeliveryFee: LOCAL_DELIVERY_FEE,
    outsideDeliveryFee: OUTSIDE_DELIVERY_FEE
  };
  if (!areaKey) return 0;
  const isLocal = areaKey === LOCAL_DELIVERY_AREA;
  if (isLocal) {
    return subtotal >= r.localFreeDeliveryMin ? 0 : r.localDeliveryFee;
  }
  return subtotal >= r.outsideFreeDeliveryMin ? 0 : r.outsideDeliveryFee;
};

export const PAYMENT_METHODS = [
  { value: "credit_card", label: "Credit card" },
  { value: "bit", label: "Bit" },
  { value: "bank_transfer", label: "Bank transfer" }
];
