import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, Lock, Store } from "lucide-react";
import { buildStoreClosedScheduleLine, pickLocalized } from "../utils/storeClosedScheduleLine";

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  primarySurface: "#eef7f1",
  primaryBorder: "#a3cfb4",
  bg: "#faf8f5",
  surface: "#ffffff",
  border: "#e8e3dc",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  textInverse: "#ffffff"
};

export default function StoreClosedSection({ settings, variant = "banner" }) {
  const { t, i18n } = useTranslation("storeClosed");
  const lang = String(i18n.language || "he").split("-")[0].toLowerCase();

  const title = pickLocalized(settings?.closedTitle, lang) || t("fallbackTitle");
  const scheduleLine = buildStoreClosedScheduleLine(settings, lang, t);

  const isPage = variant === "page";
  const outerPad = isPage ? "48px 20px 64px" : "20px 20px 28px";
  const maxW = isPage ? 520 : 640;

  return (
    <section
      aria-live="polite"
      style={{
        padding: outerPad,
        background: isPage ? colors.bg : "transparent",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box"
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          width: "100%",
          maxWidth: maxW,
          borderRadius: 20,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          boxShadow: isPage
            ? "0 12px 40px rgba(28,25,23,0.08), 0 4px 12px rgba(28,25,23,0.04)"
            : "0 8px 28px rgba(28,25,23,0.07), 0 2px 8px rgba(28,25,23,0.04)",
          padding: isPage ? "40px 32px" : "28px 24px",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <motion.div
          aria-hidden
          initial={{ scale: 0.92, opacity: 0.35 }}
          animate={{ scale: 1, opacity: 0.55 }}
          transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: "-40%",
            background:
              "radial-gradient(circle at 30% 20%, rgba(30,107,60,0.12) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(30,107,60,0.08) 0%, transparent 40%)",
            pointerEvents: "none"
          }}
        />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <motion.div
            initial={{ scale: 0.85, rotate: -6 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            style={{
              width: 72,
              height: 72,
              margin: "0 auto 18px",
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
              flexWrap: "wrap"
            }}
          >
            <Lock size={18} strokeWidth={2.2} color={colors.textMuted} aria-hidden />
            <h1
              style={{
                margin: 0,
                fontSize: isPage ? 26 : 22,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: colors.textPrimary,
                lineHeight: 1.25
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
                padding: "10px 14px",
                borderRadius: 12,
                background: colors.primarySurface,
                border: `1px solid ${colors.primaryBorder}`,
                color: colors.primary,
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 18
              }}
            >
              <Clock size={17} strokeWidth={2} aria-hidden />
              <span>{scheduleLine}</span>
            </div>
          ) : null}

          {isPage ? (
            <div style={{ marginTop: 28 }}>
              <Link
                to="/"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.primary,
                  textDecoration: "none",
                  borderBottom: `2px solid ${colors.primaryBorder}`
                }}
              >
                {t("backHome")}
              </Link>
            </div>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
