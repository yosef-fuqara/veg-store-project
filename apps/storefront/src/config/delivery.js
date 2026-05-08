// Mirror of backend delivery rules. The backend remains the source of truth;
// these constants are used only as a fallback for offline rendering and are
// kept in sync with `apps/api/src/constants/delivery.js`.

export const LOCAL_DELIVERY_AREA = "buaine_nujeidat";

export const LOCAL_FREE_DELIVERY_MIN = 100;
export const OUTSIDE_FREE_DELIVERY_MIN = 200;
export const LOCAL_DELIVERY_FEE = 10;
export const OUTSIDE_DELIVERY_FEE = 30;

export const ALLOWED_DELIVERY_AREAS = [
  { key: "buaine_nujeidat", label: "Bu'eine Nujeidat", isLocal: true },
  { key: "eilabun", label: "Eilabun", isLocal: false },
  { key: "kafr_manda", label: "Kafr Manda", isLocal: false },
  { key: "sakhnin", label: "Sakhnin", isLocal: false },
  { key: "arraba", label: "Arraba", isLocal: false },
  { key: "deir_hanna", label: "Deir Hanna", isLocal: false },
  { key: "mashhad", label: "Mashhad", isLocal: false },
  { key: "nazareth", label: "Nazareth", isLocal: false }
];

/**
 * Mirrors the backend rule. Used to render an *estimate* — the backend still
 * decides the final fee at order creation.
 */
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
