/**
 * Wall-clock helpers for operating hours in a specific IANA time zone (no extra deps).
 * Kept in sync with apps/api/src/utils/zonedOperatingHours.js
 */

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * @param {string} s
 * @returns {{ hour: number, minute: number } | null}
 */
export function parseHHMM(s) {
  const m = String(s ?? "").trim().match(HHMM_RE);
  if (!m) return null;
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

/**
 * @param {Date} date
 * @param {string} timeZone IANA zone, e.g. Asia/Jerusalem
 */
export function partsInTimeZone(date, timeZone) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const o = { y: 0, m: 0, d: 0, hour: 0, minute: 0 };
  for (const p of fmt.formatToParts(date)) {
    if (p.type === "year") o.y = Number(p.value);
    if (p.type === "month") o.m = Number(p.value);
    if (p.type === "day") o.d = Number(p.value);
    if (p.type === "hour") o.hour = Number(p.value);
    if (p.type === "minute") o.minute = Number(p.value);
  }
  return o;
}

function minutesSinceMidnight(hour, minute) {
  return hour * 60 + minute;
}

/**
 * @returns {number | null}
 */
function utcMillisAtZonedWallClock(timeZone, y, m, d, hour, minute) {
  const start = Date.UTC(y, m - 1, d, 0, 0, 0, 0) - 12 * 3600000;
  const end = start + 50 * 3600000;
  for (let ms = start; ms < end; ms += 60000) {
    const p = partsInTimeZone(new Date(ms), timeZone);
    if (p.y === y && p.m === m && p.d === d && p.hour === hour && p.minute === minute) {
      return ms;
    }
  }
  return null;
}

function addOneZonedDay(timeZone, y, m, d) {
  const noon = utcMillisAtZonedWallClock(timeZone, y, m, d, 12, 0);
  const anchor = noon ?? Date.UTC(y, m - 1, d, 15, 0, 0, 0);
  return partsInTimeZone(new Date(anchor + 25 * 3600000), timeZone);
}

/**
 * @param {object} opts
 * @param {Date} opts.at
 * @param {string} opts.timeZone
 * @param {number} opts.openM minutes [0,1440)
 * @param {number} opts.closeM minutes [0,1440)
 * @returns {{ within: boolean, nextOpenAtMs: number | null }}
 */
export function evaluateWindow({ at, timeZone, openM, closeM }) {
  const p = partsInTimeZone(at, timeZone);
  const nowM = minutesSinceMidnight(p.hour, p.minute);
  const sameSpan = openM < closeM;

  if (sameSpan) {
    const within = nowM >= openM && nowM < closeM;
    if (within) return { within: true, nextOpenAtMs: null };

    if (nowM < openM) {
      const oh = Math.floor(openM / 60);
      const om = openM % 60;
      const ms = utcMillisAtZonedWallClock(timeZone, p.y, p.m, p.d, oh, om);
      return { within: false, nextOpenAtMs: ms };
    }
    const nextDay = addOneZonedDay(timeZone, p.y, p.m, p.d);
    const oh = Math.floor(openM / 60);
    const om = openM % 60;
    const ms = utcMillisAtZonedWallClock(timeZone, nextDay.y, nextDay.m, nextDay.d, oh, om);
    return { within: false, nextOpenAtMs: ms };
  }

  const within = nowM >= openM || nowM < closeM;
  if (within) return { within: true, nextOpenAtMs: null };

  const oh = Math.floor(openM / 60);
  const om = openM % 60;
  const todayOpen = utcMillisAtZonedWallClock(timeZone, p.y, p.m, p.d, oh, om);
  if (todayOpen != null && todayOpen > at.getTime()) {
    return { within: false, nextOpenAtMs: todayOpen };
  }
  const nextDay = addOneZonedDay(timeZone, p.y, p.m, p.d);
  const ms = utcMillisAtZonedWallClock(timeZone, nextDay.y, nextDay.m, nextDay.d, oh, om);
  return { within: false, nextOpenAtMs: ms };
}
