import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEY } from "../i18n";

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

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation("nav");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const currentCode = (i18n.language || "he").split("-")[0];
  const current = OPTIONS.find((o) => o.code === currentCode) || OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  const select = (code) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore quota / private mode
    }
    setOpen(false);
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label={t("language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
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
        }}
      >
        <span aria-hidden style={{ fontSize: "16px", lineHeight: 1 }}>
          {current.flag}
        </span>
        <span>{current.label}</span>
        <span aria-hidden style={{ fontSize: "10px", opacity: 0.7 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("language")}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            insetInlineEnd: 0,
            margin: 0,
            padding: "4px",
            listStyle: "none",
            minWidth: "100%",
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            zIndex: 120,
          }}
        >
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
                }}
              >
                <span aria-hidden style={{ fontSize: "16px", lineHeight: 1 }}>
                  {opt.flag}
                </span>
                <span>{opt.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
