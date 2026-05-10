import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  surface: "#ffffff",
  border: "#e8e3dc",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  textInverse: "#ffffff",
};

const shadow = {
  lg: "0 24px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)",
};

/**
 * @param {{ open: boolean; onClose: () => void }} props
 */
const SignInToAddToCartModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("cart");
  const lang = (i18n.language || "he").split("-")[0];
  const isRtl = lang === "he" || lang === "ar";

  const goLogin = useCallback(() => {
    onClose();
    navigate("/login");
  }, [navigate, onClose]);

  const goRegister = useCallback(() => {
    onClose();
    navigate("/register");
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="sign-in-cart-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(28, 25, 23, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            boxSizing: "border-box",
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-in-cart-message"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? "rtl" : "ltr"}
            style={{
              width: "100%",
              maxWidth: "400px",
              background: colors.surface,
              borderRadius: "16px",
              border: `1px solid ${colors.border}`,
              boxShadow: shadow.lg,
              padding: "24px",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t("signInToAdd.close")}
              style={{
                position: "absolute",
                top: "12px",
                insetInlineEnd: "12px",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: colors.textMuted,
                fontSize: "22px",
                lineHeight: 1,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>

            <p
              id="sign-in-cart-message"
              style={{
                margin: "0",
                marginInlineEnd: "32px",
                marginBottom: "24px",
                fontSize: "18px",
                lineHeight: "28px",
                fontWeight: 600,
                color: colors.textPrimary,
              }}
            >
              {t("signInToAdd.message")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <motion.button
                type="button"
                onClick={goLogin}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "none",
                  background: colors.primary,
                  color: colors.textInverse,
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(30,107,60,0.30)",
                }}
              >
                {t("signInToAdd.signIn")}
              </motion.button>
              <button
                type="button"
                onClick={goRegister}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.primary,
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("signInToAdd.createAccount")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SignInToAddToCartModal;
