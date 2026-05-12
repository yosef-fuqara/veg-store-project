import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Clock, Lock, Store, X } from "lucide-react";
import { buildStoreClosedScheduleLine, pickLocalized } from "../utils/storeClosedScheduleLine";

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

export default function StoreClosedEntryModal({ open, onDismiss, settings }) {
  const { t, i18n } = useTranslation("storeClosed");
  const lang = String(i18n.language || "he").split("-")[0].toLowerCase();

  const title = pickLocalized(settings?.closedTitle, lang) || t("fallbackTitle");
  const scheduleLine = buildStoreClosedScheduleLine(settings, lang, t);

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
          key="store-closed-entry-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
            background: "rgba(28, 25, 23, 0.52)",
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
            aria-labelledby="store-closed-entry-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "min(92vw, 640px)",
              minWidth: 0,
              overflow: "hidden",
              borderRadius: 20,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow: "0 24px 64px rgba(28,25,23,0.18), 0 8px 20px rgba(28,25,23,0.08)",
              padding: "32px 22px 28px",
              boxSizing: "border-box"
            }}
          >
            <button
              type="button"
              onClick={onDismiss}
              aria-label={t("closeModalAria")}
              style={{
                position: "absolute",
                top: 12,
                insetInlineEnd: 12,
                width: 40,
                height: 40,
                borderRadius: 10,
                border: "none",
                background: colors.primarySurface,
                color: colors.textSecondary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s, color 0.15s"
              }}
            >
              <X size={20} strokeWidth={2.2} aria-hidden />
            </button>

            <motion.div
              aria-hidden
              initial={{ scale: 0.92, opacity: 0.35 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: "-35%",
                background:
                  "radial-gradient(circle at 30% 18%, rgba(30,107,60,0.14) 0%, transparent 42%), radial-gradient(circle at 78% 82%, rgba(30,107,60,0.09) 0%, transparent 38%)",
                pointerEvents: "none",
                borderRadius: 20
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 1,
                textAlign: "center",
                paddingTop: 4,
                maxWidth: "100%",
                overflow: "hidden"
              }}
            >
              <motion.div
                initial={{ scale: 0.88, rotate: -5 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                style={{
                  width: 72,
                  height: 72,
                  margin: "0 auto 16px",
                  borderRadius: "50%",
                  background: colors.primarySurface,
                  border: `2px solid ${colors.primaryBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.primary
                }}
              >
                <Store size={34} strokeWidth={2} aria-hidden />
              </motion.div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 10,
                  flexWrap: "wrap",
                  paddingInline: 8
                }}
              >
                <Lock size={18} strokeWidth={2.2} color={colors.textMuted} aria-hidden />
                <h1
                  id="store-closed-entry-title"
                  style={{
                    margin: 0,
                    maxWidth: "100%",
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: colors.textPrimary,
                    lineHeight: 1.25,
                    overflowWrap: "anywhere",
                    wordBreak: "break-word"
                  }}
                >
                  {title}
                </h1>
              </div>

              {scheduleLine ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    maxWidth: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: colors.primarySurface,
                    border: `1px solid ${colors.primaryBorder}`,
                    color: colors.primary,
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 16,
                    boxSizing: "border-box",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word"
                  }}
                >
                  <Clock size={17} strokeWidth={2} aria-hidden />
                  <span>{scheduleLine}</span>
                </div>
              ) : null}

              <motion.button
                type="button"
                onClick={onDismiss}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.12 }}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 4,
                  padding: "12px 18px",
                  borderRadius: 12,
                  border: `1.5px solid ${colors.primaryBorder}`,
                  background: colors.primarySurface,
                  color: colors.primary,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                {t("continueBrowsing")}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
