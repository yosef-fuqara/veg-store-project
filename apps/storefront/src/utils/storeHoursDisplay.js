const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "21:00";

/**
 * Compact hours string for nav/footer (e.g. "09:00–21:00"), or null when hidden.
 * @param {Record<string, unknown> | null | undefined} settings
 */
export function getNavStoreHoursCompact(settings) {
  if (!settings) return null;
  const open = String(settings.operatingOpenLocal || "").trim();
  const close = String(settings.operatingCloseLocal || "").trim();
  if (!open || !close || open === close) return null;
  const isDefaultPair = open === DEFAULT_OPEN && close === DEFAULT_CLOSE;
  const shouldShow = settings.operatingHoursEnabled === true || !isDefaultPair;
  if (!shouldShow) return null;
  return `${open}\u2013${close}`;
}

/**
 * Hours line for the business-hours modal (settings or localized fallback body).
 * @param {Record<string, unknown> | null | undefined} settings
 * @param {string} fallbackBody e.g. "א׳-ש׳ 08:00–22:00"
 */
export function getModalHoursBody(settings, fallbackBody) {
  const compact = getNavStoreHoursCompact(settings);
  return compact || fallbackBody;
}
