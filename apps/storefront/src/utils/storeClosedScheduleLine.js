function pickLocalized(map, lang) {
  if (!map || typeof map !== "object") return "";
  const raw = map[lang] || map.he || map.en || map.ar || "";
  return typeof raw === "string" ? raw.trim() : "";
}

function formatReopenAt(iso, lang) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const locale = lang === "ar" ? "ar" : lang === "he" ? "he-IL" : "en-GB";
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/**
 * @param {object} settings from /store-settings
 * @param {string} lang he | en | ar
 * @param {import("i18next").TFunction} t storeClosed namespace
 */
export function buildStoreClosedScheduleLine(settings, lang, t) {
  if (settings?.reopenAt != null && settings.reopenAt !== "") {
    return `${t("reopenOn")} ${formatReopenAt(settings.reopenAt, lang)}`;
  }

  return "";
}

export { pickLocalized, formatReopenAt };
