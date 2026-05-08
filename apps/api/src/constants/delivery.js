const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/app-error");

// Local village (free delivery threshold is lower)
const LOCAL_DELIVERY_AREA = "buaine_nujeidat";

// Pricing thresholds and fees (ILS).
const LOCAL_FREE_DELIVERY_MIN = 100;
const OUTSIDE_FREE_DELIVERY_MIN = 200;
const LOCAL_DELIVERY_FEE = 10;
const OUTSIDE_DELIVERY_FEE = 30;

// Allowed delivery destinations. The first entry is the local village; the rest
// are nearby supported areas. Labels are shown to customers; keys are stored.
const ALLOWED_DELIVERY_AREAS = [
  { key: "buaine_nujeidat", label: "Bu'eine Nujeidat", isLocal: true },
  { key: "eilabun", label: "Eilabun", isLocal: false },
  { key: "kafr_manda", label: "Kafr Manda", isLocal: false },
  { key: "sakhnin", label: "Sakhnin", isLocal: false },
  { key: "arraba", label: "Arraba", isLocal: false },
  { key: "deir_hanna", label: "Deir Hanna", isLocal: false },
  { key: "mashhad", label: "Mashhad", isLocal: false },
  { key: "nazareth", label: "Nazareth", isLocal: false }
];

const ALLOWED_DELIVERY_AREA_KEYS = ALLOWED_DELIVERY_AREAS.map((a) => a.key);

const getDeliveryArea = (areaKey) =>
  ALLOWED_DELIVERY_AREAS.find((a) => a.key === areaKey) || null;

const isLocalDeliveryArea = (areaKey) => areaKey === LOCAL_DELIVERY_AREA;

const isAllowedDeliveryArea = (areaKey) =>
  typeof areaKey === "string" && ALLOWED_DELIVERY_AREA_KEYS.includes(areaKey);

/**
 * Backend source of truth for delivery fees.
 *
 * Local village (Bu'eine Nujeidat):
 *   subtotal >= 100 ILS  → free
 *   subtotal <  100 ILS  → 10 ILS
 *
 * Other allowed areas:
 *   subtotal >= 200 ILS  → free
 *   subtotal <  200 ILS  → 30 ILS
 *
 * Unsupported area → BAD_REQUEST.
 */
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
  LOCAL_FREE_DELIVERY_MIN,
  OUTSIDE_FREE_DELIVERY_MIN,
  LOCAL_DELIVERY_FEE,
  OUTSIDE_DELIVERY_FEE,
  getDeliveryArea,
  isLocalDeliveryArea,
  isAllowedDeliveryArea,
  calculateDeliveryFee
};
