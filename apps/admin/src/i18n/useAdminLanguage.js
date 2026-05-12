import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

const SUPPORTED = ["en", "he"];
const RTL_LANGS = new Set(["he"]);

const normalizeLang = (raw) => {
  const base = String(raw || "en").split("-")[0].toLowerCase();
  return SUPPORTED.includes(base) ? base : "en";
};

/**
 * Syncs the active admin language with <html lang>/<html dir>, exposes a setter,
 * and reports the current direction. RTL only for Hebrew.
 */
export function useAdminLanguage() {
  const { i18n } = useTranslation();

  const lang = useMemo(() => normalizeLang(i18n.language), [i18n.language]);
  const dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
  const isRtl = dir === "rtl";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", dir);
  }, [lang, dir]);

  const changeLanguage = useCallback(
    (next) => {
      const normalized = normalizeLang(next);
      if (normalized === lang) return;
      i18n.changeLanguage(normalized);
    },
    [i18n, lang]
  );

  return { lang, dir, isRtl, changeLanguage, supported: SUPPORTED };
}
