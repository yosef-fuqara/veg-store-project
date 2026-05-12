import { parseHHMM, evaluateWindow } from "./zonedOperatingHours";

/**
 * True when the admin enabled the hours notice and the current instant is outside
 * the configured window in the configured time zone. Used for checkout confirmation only;
 * it never blocks the store.
 *
 * @param {object|null|undefined} settings from GET /store-settings
 * @param {Date} [at]
 * @returns {boolean}
 */
export function isOutsideConfiguredBusinessHoursNow(settings, at = new Date()) {
  if (!settings || typeof settings !== "object") return false;
  if (settings.operatingHoursEnabled !== true) return false;

  const tz =
    typeof settings.operatingTimezone === "string" && settings.operatingTimezone.trim()
      ? settings.operatingTimezone.trim()
      : "Asia/Jerusalem";
  const openStr =
    typeof settings.operatingOpenLocal === "string" && settings.operatingOpenLocal.trim()
      ? settings.operatingOpenLocal.trim()
      : "";
  const closeStr =
    typeof settings.operatingCloseLocal === "string" && settings.operatingCloseLocal.trim()
      ? settings.operatingCloseLocal.trim()
      : "";

  const openP = parseHHMM(openStr);
  const closeP = parseHHMM(closeStr);
  if (!openP || !closeP) return false;

  const openM = openP.hour * 60 + openP.minute;
  const closeM = closeP.hour * 60 + closeP.minute;
  if (openM === closeM) return false;

  try {
    const { within } = evaluateWindow({
      at,
      timeZone: tz,
      openM,
      closeM
    });
    return !within;
  } catch {
    return false;
  }
}
