import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Leaf } from "lucide-react";

const colors = {
  primary: "#1e6b3c",
  primarySurface: "#eef7f1",
  primaryBorder: "#a3cfb4",
  surface: "#ffffff",
  border: "#e8e3dc",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  textInverse: "#ffffff"
};

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onConfirm — customer chooses to place the order
 * @param {() => void} props.onDismiss — customer chooses not to continue (or overlay/Escape)
 * @param {boolean} [props.confirmDisabled]
 */
export default function BusinessHoursNoticeModal({ open, onConfirm, onDismiss, confirmDisabled }) {
  const { t } = useTranslation("checkout");

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onDismiss();
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
  }, [open, onDismiss]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="business-hours-notice-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 340,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding:
              "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
            background: "rgba(28, 25, 23, 0.48)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            boxSizing: "border-box",
            overflow: "hidden"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onDismiss();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="business-hours-notice-title"
            aria-describedby="business-hours-notice-message"
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            dir="auto"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "min(92vw, 420px)",
              minWidth: 0,
              maxHeight: "min(88dvh, 520px)",
              overflow: "hidden",
              borderRadius: 16,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow:
                "0 24px 56px rgba(28,25,23,0.16), 0 8px 20px rgba(28,25,23,0.08)",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div
              style={{
                padding: "24px 20px 20px",
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                minHeight: 0,
                flex: "1 1 auto",
                boxSizing: "border-box"
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  margin: "0 auto 14px",
                  borderRadius: "50%",
                  background: colors.primarySurface,
                  border: `2px solid ${colors.primaryBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.primary,
                  flexShrink: 0
                }}
              >
                <Leaf size={28} strokeWidth={2} aria-hidden />
              </div>

              <h2
                id="business-hours-notice-title"
                style={{
                  margin: "0 0 10px",
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: colors.textPrimary,
                  lineHeight: 1.3,
                  textAlign: "center",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word"
                }}
              >
                {t("businessHoursNotice.title")}
              </h2>

              <p
                id="business-hours-notice-message"
                style={{
                  margin: 0,
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: colors.textSecondary,
                  textAlign: "center",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word"
                }}
              >
                {t("businessHoursNotice.message")}
              </p>
            </div>

            <div
              style={{
                padding: "0 20px 20px",
                flexShrink: 0,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 10
              }}
            >
              <motion.button
                type="button"
                onClick={onDismiss}
                disabled={confirmDisabled}
                whileHover={!confirmDisabled ? { scale: 1.01 } : {}}
                whileTap={!confirmDisabled ? { scale: 0.99 } : {}}
                transition={{ duration: 0.12 }}
                style={{
                  width: "100%",
                  padding: "12px 18px",
                  borderRadius: 10,
                  border: `1.5px solid ${colors.primaryBorder}`,
                  background: colors.primarySurface,
                  color: colors.primary,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: confirmDisabled ? "not-allowed" : "pointer",
                  opacity: confirmDisabled ? 0.65 : 1,
                  fontFamily: "inherit"
                }}
              >
                {t("businessHoursNotice.declineButton")}
              </motion.button>
              <motion.button
                type="button"
                onClick={onConfirm}
                disabled={confirmDisabled}
                whileHover={!confirmDisabled ? { scale: 1.02 } : {}}
                whileTap={!confirmDisabled ? { scale: 0.98 } : {}}
                transition={{ duration: 0.12 }}
                style={{
                  width: "100%",
                  padding: "12px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: confirmDisabled ? colors.border : colors.primary,
                  color: confirmDisabled ? colors.textMuted : colors.textInverse,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: confirmDisabled ? "not-allowed" : "pointer",
                  boxShadow: confirmDisabled ? "none" : "0 4px 14px rgba(30,107,60,0.28)",
                  fontFamily: "inherit"
                }}
              >
                {t("businessHoursNotice.confirmButton")}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
