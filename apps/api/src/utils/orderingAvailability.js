const { parseHHMM, evaluateWindow } = require("./zonedOperatingHours");

const DEFAULT_TZ = "Asia/Jerusalem";
const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "21:00";

/**
 * Minimal fields used for manual open/close gate.
 * @param {object} doc
 */
function normalizeSettingsForEvaluation(doc) {
  const d = doc && typeof doc === "object" ? doc : {};
  return {
    isStoreOpen: d.isStoreOpen !== false
  };
}

/**
 * Ordering is allowed only when the admin has not manually closed the store.
 * Business hours never affect this result.
 * @param {object} settings normalized via normalizeSettingsForEvaluation
 */
function evaluateStoreOrderingGate(settings) {
  const s = settings;
  if (!s.isStoreOpen) {
    return {
      canOrderNow: false,
      storeClosedReason: "STORE_CLOSED",
      nextOpenAt: null
    };
  }
  return {
    canOrderNow: true,
    storeClosedReason: null,
    nextOpenAt: null
  };
}

/**
 * Normalized business-hours fields for customer notice (not blocking).
 * @param {object} doc
 */
function normalizeBusinessHoursForNotice(doc) {
  const d = doc && typeof doc === "object" ? doc : {};
  const tz =
    typeof d.operatingTimezone === "string" && d.operatingTimezone.trim()
      ? d.operatingTimezone.trim()
      : DEFAULT_TZ;
  const operatingOpenLocal =
    typeof d.operatingOpenLocal === "string" && d.operatingOpenLocal.trim()
      ? d.operatingOpenLocal.trim()
      : DEFAULT_OPEN;
  const operatingCloseLocal =
    typeof d.operatingCloseLocal === "string" && d.operatingCloseLocal.trim()
      ? d.operatingCloseLocal.trim()
      : DEFAULT_CLOSE;

  return {
    operatingHoursEnabled: d.operatingHoursEnabled === true,
    operatingTimezone: tz,
    operatingOpenLocal,
    operatingCloseLocal
  };
}

/**
 * True when admin enabled the hours notice and current time is outside the configured window.
 * Returns false when hours are disabled, invalid, missing, or time cannot be evaluated.
 * @param {object} doc StoreSettings plain object
 * @param {Date} [at]
 */
function isOutsideConfiguredBusinessHours(doc, at = new Date()) {
  const h = normalizeBusinessHoursForNotice(doc);
  if (!h.operatingHoursEnabled) return false;

  const openP = parseHHMM(h.operatingOpenLocal);
  const closeP = parseHHMM(h.operatingCloseLocal);
  if (!openP || !closeP) return false;

  const openM = openP.hour * 60 + openP.minute;
  const closeM = closeP.hour * 60 + closeP.minute;
  if (openM === closeM) return false;

  try {
    const { within } = evaluateWindow({
      at,
      timeZone: h.operatingTimezone,
      openM,
      closeM
    });
    return !within;
  } catch {
    return false;
  }
}

/**
 * @param {object} doc StoreSettings document or lean object
 * @param {Date} [_at] unused; kept for call-site compatibility
 */
function isOrderingCurrentlyAllowed(doc, _at = new Date()) {
  const normalized = normalizeSettingsForEvaluation(doc);
  return evaluateStoreOrderingGate(normalized).canOrderNow;
}

module.exports = {
  DEFAULT_TZ,
  DEFAULT_OPEN,
  DEFAULT_CLOSE,
  normalizeSettingsForEvaluation,
  normalizeBusinessHoursForNotice,
  evaluateStoreOrderingGate,
  isOutsideConfiguredBusinessHours,
  isOrderingCurrentlyAllowed
};
