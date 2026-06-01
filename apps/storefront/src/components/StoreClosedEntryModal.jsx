import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Clock, Store } from "lucide-react";
import { buildStoreClosedScheduleLine, pickLocalized } from "../utils/storeClosedScheduleLine";

const displayFontFamily = "'Rubik', 'Segoe UI', system-ui, sans-serif";

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#185a33",
  primarySoft: "#e8f4ec",
  primarySoftRing: "#c5e0d0",
  surface: "#ffffff",
  border: "#ebe6df",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#78716c",
  textInverse: "#ffffff"
};

export default function StoreClosedEntryModal({ open, onDismiss, settings }) {
  const { t, i18n } = useTranslation("storeClosed");
  const lang = String(i18n.language || "he").split("-")[0].toLowerCase();

  const title = pickLocalized(settings?.closedTitle, lang) || t("fallbackTitle");
  const subtitle = t("entrySubtitle");
  const scheduleLine = buildStoreClosedScheduleLine(settings, lang, t);

  useEffect(() => {
    if (!open) return undefined;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open]);

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
            padding:
              "max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))",
            background: "rgba(28, 25, 23, 0.45)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxSizing: "border-box",
            overflow: "hidden"
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-closed-entry-title"
            aria-describedby="store-closed-entry-subtitle"
            dir="auto"
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "min(92vw, 400px)",
              minWidth: 0,
              overflow: "hidden",
              borderRadius: 24,
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow:
                "0 28px 72px rgba(28, 25, 23, 0.14), 0 10px 24px rgba(28, 25, 23, 0.06), 0 0 0 1px rgba(255,255,255,0.6) inset",
              padding: "36px 28px 28px",
              boxSizing: "border-box"
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(30,107,60,0.08) 0%, transparent 70%)",
                pointerEvents: "none"
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                maxWidth: "100%"
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.04 }}
                style={{
                  position: "relative",
                  width: 80,
                  height: 80,
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: colors.primarySoft,
                    boxShadow: `0 0 0 1px ${colors.primarySoftRing}`
                  }}
                />
                <Store
                  size={36}
                  strokeWidth={1.75}
                  color={colors.primary}
                  aria-hidden
                  style={{ position: "relative", zIndex: 1 }}
                />
              </motion.div>

              <h1
                id="store-closed-entry-title"
                style={{
                  margin: 0,
                  maxWidth: "100%",
                  fontFamily: displayFontFamily,
                  fontSize: "clamp(1.375rem, 5vw, 1.5rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  color: colors.textPrimary,
                  lineHeight: 1.3,
                  overflowWrap: "anywhere",
                  wordBreak: "break-word"
                }}
              >
                {title}
              </h1>

              <p
                id="store-closed-entry-subtitle"
                style={{
                  margin: "14px 0 0",
                  maxWidth: "32ch",
                  fontSize: "0.9375rem",
                  fontWeight: 400,
                  lineHeight: 1.65,
                  color: colors.textSecondary,
                  overflowWrap: "anywhere",
                  wordBreak: "break-word"
                }}
              >
                {subtitle}
              </p>

              {scheduleLine ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    maxWidth: "100%",
                    marginTop: 20,
                    padding: "10px 14px",
                    borderRadius: 14,
                    background: colors.primarySoft,
                    border: `1px solid ${colors.primarySoftRing}`,
                    color: colors.primary,
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    lineHeight: 1.45,
                    boxSizing: "border-box",
                    flexWrap: "wrap",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word"
                  }}
                >
                  <Clock size={16} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />
                  <span>{scheduleLine}</span>
                </div>
              ) : null}

              <motion.button
                type="button"
                onClick={onDismiss}
                whileHover={{
                  backgroundColor: colors.primaryHover,
                  boxShadow: "0 6px 20px rgba(30, 107, 60, 0.28)"
                }}
                whileTap={{ scale: 0.97, backgroundColor: colors.primaryHover }}
                transition={{ duration: 0.15 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  marginTop: scheduleLine ? 24 : 28,
                  minHeight: 48,
                  padding: "14px 20px",
                  borderRadius: 16,
                  border: "none",
                  background: colors.primary,
                  color: colors.textInverse,
                  fontFamily: displayFontFamily,
                  fontSize: "1rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  lineHeight: 1.25,
                  textAlign: "center",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(30, 107, 60, 0.22)",
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation"
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
