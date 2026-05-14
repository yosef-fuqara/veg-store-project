import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminLanguage } from "./useAdminLanguage";

const colors = {
  surface: "#ffffff",
  border: "#e8e3dc",
  bg: "#faf8f5",
  textPrimary: "#1c1917",
  textMuted: "#a8a29e",
  primary: "#1e6b3c",
  activeBg: "#f0f7f2"
};

const LANG_OPTIONS = [
  { code: "en", short: "EN", labelKey: "languageSwitcher.english" },
  { code: "he", short: "HE", labelKey: "languageSwitcher.hebrew" }
];

/**
 * Compact dropdown for switching the admin language.
 * Renders the current language as a short code (EN / HE) plus a chevron.
 */
/**
 * @param {{ size?: "sm" | "md", rail?: boolean }} props
 * — rail: icon-sized trigger for collapsed desktop sidebar (still opens full dropdown)
 */
const LanguageSwitcher = ({ size = "md", rail = false }) => {
  const { t } = useTranslation("nav");
  const { lang, changeLanguage } = useAdminLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const isCompact = size === "sm" || rail;

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentOption = LANG_OPTIONS.find((opt) => opt.code === lang) || LANG_OPTIONS[0];

  const triggerStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: rail ? "4px" : "6px",
    padding: rail ? "8px 6px" : isCompact ? "6px 10px" : "8px 12px",
    borderRadius: "10px",
    border: `1px solid ${open ? colors.primary : colors.border}`,
    background: open ? colors.bg : colors.surface,
    color: colors.textPrimary,
    fontSize: rail ? "11px" : "12px",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.04em",
    fontFamily: "inherit",
    transition: "background 0.15s, border-color 0.15s",
    whiteSpace: "nowrap",
    minWidth: rail ? "40px" : isCompact ? "44px" : "52px",
    width: rail ? "44px" : "auto",
    boxSizing: "border-box",
  };

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("languageSwitcher.label")}
        title={t("languageSwitcher.label")}
        style={triggerStyle}
      >
        {!rail && (
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15 15 0 0 1 0 20" />
            <path d="M12 2a15 15 0 0 0 0 20" />
          </svg>
        )}
        <span>{currentOption.short}</span>
        {!rail && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={t("languageSwitcher.label")}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            insetInlineEnd: 0,
            zIndex: 50,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            overflow: "hidden",
            minWidth: "140px"
          }}
        >
          {LANG_OPTIONS.map((opt) => {
            const active = opt.code === lang;
            return (
              <button
                key={opt.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  changeLanguage(opt.code);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  background: active ? colors.activeBg : "transparent",
                  color: active ? colors.primary : colors.textPrimary,
                  fontSize: "13px",
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  textAlign: "start",
                  fontFamily: "inherit",
                  transition: "background 0.12s"
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = colors.bg;
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <span>{t(opt.labelKey)}</span>
                <span style={{ fontSize: "11px", color: active ? colors.primary : colors.textMuted, fontWeight: 700, letterSpacing: "0.04em" }}>
                  {opt.short}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
