/**
 * Israeli mobile numbers: local 05[0234589]XXXXXXX (10 digits) or international +972 / 972.
 * Keep logic aligned with apps/storefront/src/utils/israeliMobilePhone.js
 */

const BLOCKED_LOCAL = new Set(["0000000000", "1234567890"]);

/**
 * @param {unknown} input
 * @returns {string | null} Local format 05XXXXXXXX (10 digits) or null if invalid
 */
function normalizeIsraeliMobile(input) {
  if (input == null) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const compact = raw.replace(/\s/g, "").replace(/[-().]/g, "");
  if (!compact.length) return null;
  if (/[^+\d]/.test(compact)) return null;
  if (compact.includes("+") && !compact.startsWith("+")) return null;

  const digitsOnly = compact.startsWith("+") ? compact.slice(1) : compact;
  if (!/^\d+$/.test(digitsOnly)) return null;

  let local = null;

  if (digitsOnly.startsWith("972")) {
    const rest = digitsOnly.slice(3);
    if (rest.length === 10 && rest.startsWith("0")) {
      local = rest;
    } else if (rest.length === 9 && rest.startsWith("5")) {
      local = `0${rest}`;
    } else {
      return null;
    }
  } else if (digitsOnly.length === 10 && digitsOnly.startsWith("05")) {
    local = digitsOnly;
  } else if (digitsOnly.length === 9 && digitsOnly.startsWith("5")) {
    local = `0${digitsOnly}`;
  } else {
    return null;
  }

  if (!/^05[0234589]\d{7}$/.test(local)) return null;
  if (BLOCKED_LOCAL.has(local)) return null;

  return local;
}

/**
 * @param {unknown} input
 * @returns {boolean}
 */
function isValidIsraeliMobile(input) {
  return normalizeIsraeliMobile(input) != null;
}

module.exports = {
  normalizeIsraeliMobile,
  isValidIsraeliMobile
};
