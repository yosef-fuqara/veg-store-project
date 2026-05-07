import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

const RTL_LANGS = new Set(["he", "ar"]);

/**
 * Syncs document <html> lang/dir with the active i18n language (RTL for he/ar, LTR for en).
 */
export function useDir() {
  const { i18n } = useTranslation();

  const baseLang = useMemo(() => {
    const raw = i18n.language || "he";
    return String(raw).split("-")[0].toLowerCase();
  }, [i18n.language]);

  const dir = RTL_LANGS.has(baseLang) ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    html.setAttribute("lang", baseLang);
    html.setAttribute("dir", dir);
  }, [baseLang, dir]);

  return { dir, lang: baseLang };
}
