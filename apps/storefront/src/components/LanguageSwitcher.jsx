import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEY } from "../i18n";
import MobileHeaderPopover from "./MobileHeaderPopover";

/** Flag + locale label. Arabic is spoken in many countries; 🇸🇦 is a common picker convention. */
const OPTIONS = [
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const colors = {
  border: "#e8e3dc",
  text: "#57534e",
  surface: "#fff",
};

/**
 * @param {{ compact?: boolean, menuOpen?: boolean }} props
 * `compact` — icon-only control for the mobile header (flag only).
 * `menuOpen` — close the dropdown when the mobile nav menu opens.
 */
const LanguageSwitcher = ({ compact = false, menuOpen = false }) => {
  const { i18n, t } = useTranslation("nav");
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const popoverRef = useRef(null);

  const currentCode = (i18n.language || "he").split("-")[0];
  const current = OPTIONS.find((o) => o.code === currentCode) || OPTIONS[0];

  useEffect(() => {
    if (menuOpen) setOpen(false);
  }, [menuOpen]);

  useEffect(() => {
    if (compact || !open) return;
    const onDoc = (e) => {
      const anchor = anchorRef.current;
      const menu = popoverRef.current;
      const target = e.target;
      if (
        anchor &&
        target &&
        !anchor.contains(target) &&
        !(menu && menu.contains(target))
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [compact, open]);

  const select = (code) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore quota / private mode
    }
    setOpen(false);
  };

  const listStyle = {
    margin: 0,
    padding: "4px",
    listStyle: "none",
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
  };

  const languageOptions = (
    <>
      {OPTIONS.map((opt) => (
        <li key={opt.code} role="presentation">
          <button
            type="button"
            role="option"
            aria-selected={opt.code === currentCode}
            onClick={() => select(opt.code)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              padding: "8px 10px",
              border: "none",
              borderRadius: "6px",
              background: opt.code === currentCode ? "rgba(0,0,0,0.04)" : "transparent",
              color: colors.text,
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "start",
              fontFamily: "inherit",
              whiteSpace: "normal",
            }}
          >
            <span aria-hidden style={{ fontSize: "16px", lineHeight: 1 }}>
              {opt.flag}
            </span>
            <span>{opt.label}</span>
          </button>
        </li>
      ))}
    </>
  );

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={anchorRef}
        type="button"
        aria-label={t("language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={
          compact
            ? {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                padding: 0,
                borderRadius: "10px",
                border: "none",
                background: open ? "rgba(238, 247, 241, 1)" : "transparent",
                color: colors.text,
                cursor: "pointer",
                outline: "none",
                fontFamily: "inherit",
                flexShrink: 0,
                transition: "background 0.15s, color 0.15s",
              }
            : {
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 10px",
                borderRadius: "6px",
                border: `1px solid ${colors.border}`,
                background: "transparent",
                color: colors.text,
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.15s, color 0.15s, background 0.15s",
              }
        }
      >
        <span aria-hidden style={{ fontSize: compact ? "20px" : "16px", lineHeight: 1 }}>
          {current.flag}
        </span>
        {!compact && (
          <>
            <span>{current.label}</span>
            <span aria-hidden style={{ fontSize: "10px", opacity: 0.7 }}>
              {open ? "▲" : "▼"}
            </span>
          </>
        )}
      </button>

      {compact ? (
        <MobileHeaderPopover
          anchorRef={anchorRef}
          popoverRef={popoverRef}
          open={open}
          onClose={() => setOpen(false)}
          role="listbox"
          ariaLabel={t("language")}
          desiredWidth={180}
        >
          <ul role="listbox" aria-label={t("language")} style={listStyle}>
            {languageOptions}
          </ul>
        </MobileHeaderPopover>
      ) : (
        open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              insetInlineEnd: 0,
              minWidth: "100%",
              zIndex: 120,
            }}
          >
            <ul ref={popoverRef} role="listbox" aria-label={t("language")} style={listStyle}>
              {languageOptions}
            </ul>
          </div>
        )
      )}
    </div>
  );
};

export default LanguageSwitcher;
