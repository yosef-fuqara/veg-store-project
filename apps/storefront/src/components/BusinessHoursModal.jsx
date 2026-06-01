import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";

const colors = {
  primary: "#1e6b3c",
  primarySurface: "#eef7f1",
  primaryBorder: "#a3cfb4",
  surface: "#ffffff",
  border: "#e8e3dc",
  textPrimary: "#1c1917",
  textMuted: "#a8a29e",
};

/**
 * Mobile nav: show store hours in a centered modal (no footer scroll).
 * @param {{ open: boolean; onClose: () => void; hoursBody: string }} props
 */
export default function BusinessHoursModal({ open, onClose, hoursBody }) {
  const { t, i18n } = useTranslation("nav");
  const lang = String(i18n.language || "he").split("-")[0].toLowerCase();
  const dir = lang === "he" || lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open, onClose]);

  if (typeof document === "undefined" || !hoursBody) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="business-hours-modal-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 350,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding:
              "max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))",
            background: "rgba(28, 25, 23, 0.45)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            boxSizing: "border-box",
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="business-hours-modal-title"
            dir={dir}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "min(92vw, 380px)",
              minWidth: 0,
              borderRadius: 20,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow:
                "0 24px 56px rgba(28, 25, 23, 0.14), 0 8px 20px rgba(28, 25, 23, 0.08)",
              padding: "28px 22px 24px",
              boxSizing: "border-box",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t("businessHoursModalClose")}
              style={{
                position: "absolute",
                top: 12,
                insetInlineEnd: 12,
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "none",
                background: "transparent",
                color: colors.textMuted,
                fontSize: 24,
                lineHeight: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              ×
            </button>

            <h2
              id="business-hours-modal-title"
              style={{
                margin: "0 0 18px",
                paddingInlineEnd: 36,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: colors.textPrimary,
                lineHeight: 1.3,
              }}
            >
              {t("storeHoursLabel")}
            </h2>

            <p
              style={{
                margin: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                boxSizing: "border-box",
                padding: "14px 16px",
                borderRadius: 14,
                background: colors.primarySurface,
                border: `1px solid ${colors.primaryBorder}`,
                color: colors.primary,
                fontSize: 16,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              <Clock size={20} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />
              <span>{hoursBody}</span>
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
