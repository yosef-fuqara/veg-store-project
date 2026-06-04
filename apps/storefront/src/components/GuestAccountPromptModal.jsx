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

/** Above cart fly/toast (10001–10002) and promotion popup (10050). */
const GUEST_ACCOUNT_PROMPT_Z = 10100;

/**
 * Guest nudge shown after the first add-to-cart. Reuses the SignInToAddToCartModal
 * look (portal + framer-motion overlay/dialog + RTL handling).
 *
 * @param {{ open: boolean; onClose: () => void; onContinueWithoutAccount: () => void }} props
 */
const GuestAccountPromptModal = ({ open, onClose, onContinueWithoutAccount }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("auth");
  const lang = (i18n.language || "he").split("-")[0];
  const isRtl = lang === "he" || lang === "ar";

  const goRegister = useCallback(() => {
    onClose();
    navigate("/register");
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
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
          key="guest-account-prompt-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: GUEST_ACCOUNT_PROMPT_Z,
            background: "rgba(28, 25, 23, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding:
              "max(16px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px))",
            boxSizing: "border-box",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-account-prompt-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? "rtl" : "ltr"}
            style={{
              width: "100%",
              maxWidth: "min(400px, calc(100vw - 32px))",
              maxHeight: "min(90dvh, calc(100vh - 32px))",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              margin: "auto",
              background: colors.surface,
              borderRadius: "16px",
              border: `1px solid ${colors.border}`,
              boxShadow: shadow.lg,
              padding: "clamp(20px, 5vw, 24px)",
              position: "relative",
              textAlign: "start",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t("guestAccountPromptClose")}
              style={{
                position: "absolute",
                top: "8px",
                insetInlineEnd: "8px",
                width: "44px",
                height: "44px",
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
                touchAction: "manipulation",
              }}
            >
              ×
            </button>

            <h2
              id="guest-account-prompt-title"
              style={{
                margin: "0",
                marginInlineEnd: "32px",
                marginBottom: "8px",
                fontSize: "20px",
                lineHeight: "28px",
                fontWeight: 700,
                color: colors.textPrimary,
              }}
            >
              {t("guestAccountPromptTitle")}
            </h2>

            <p
              style={{
                margin: "0 0 16px",
                fontSize: "15px",
                lineHeight: "22px",
                color: colors.textSecondary,
              }}
            >
              {t("guestAccountPromptText")}
            </p>

            <p
              style={{
                margin: "0 0 6px",
                fontSize: "14px",
                fontWeight: 600,
                color: colors.textPrimary,
                lineHeight: 1.4,
              }}
            >
              {t("guestAccountPromptBenefitsTitle")}
            </p>
            <ul
              style={{
                margin: "0 0 20px",
                paddingInlineStart: "20px",
                fontSize: "14px",
                color: colors.textSecondary,
                lineHeight: 1.6,
              }}
            >
              <li>{t("guestAccountPromptBenefit1")}</li>
              <li>{t("guestAccountPromptBenefit2")}</li>
              <li>{t("guestAccountPromptBenefit3")}</li>
            </ul>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <motion.button
                type="button"
                onClick={onContinueWithoutAccount}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%",
                  minHeight: "48px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "none",
                  background: colors.primary,
                  color: colors.textInverse,
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(30,107,60,0.30)",
                  touchAction: "manipulation",
                }}
              >
                {t("guestAccountPromptContinue")}
              </motion.button>
              <button
                type="button"
                onClick={goRegister}
                style={{
                  width: "100%",
                  minHeight: "48px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.primary,
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  touchAction: "manipulation",
                }}
              >
                {t("guestAccountPromptCreateAccount")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default GuestAccountPromptModal;
