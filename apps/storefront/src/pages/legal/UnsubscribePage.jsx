import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useDir } from "../../i18n/useDir";
import * as marketingService from "../../services/marketingService";

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  primarySurface: "#eef7f1",
  primaryBorder: "#a3cfb4",
  border: "#e8e3dc",
  bg: "#faf8f5",
  surface: "#ffffff",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  success: "#166534",
  successSurface: "#f0fdf4",
  successBorder: "#bbf7d0",
  error: "#991b1b",
  errorSurface: "#fef2f2",
  errorBorder: "#fecaca"
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 14px",
  borderRadius: "10px",
  border: `1.5px solid ${colors.border}`,
  fontSize: "15px",
  color: colors.textPrimary,
  background: colors.surface,
  outline: "none"
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "14px",
  fontWeight: 600,
  color: colors.textSecondary
};

const UnsubscribePage = () => {
  const { t } = useTranslation("legal");
  const { dir } = useDir();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!phone.trim() && !email.trim()) {
      setError(t("unsubscribe.phoneOrEmailRequired"));
      return;
    }
    setStatus("submitting");
    try {
      await marketingService.unsubscribe({ phone: phone.trim(), email: email.trim() });
      setStatus("success");
    } catch (err) {
      setStatus("idle");
      setError(err.userMessage || t("unsubscribe.error"));
    }
  };

  return (
    <section
      dir={dir}
      style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px 64px", background: colors.bg }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          padding: "clamp(20px, 4vw, 36px)"
        }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "clamp(22px, 4vw, 28px)",
            fontWeight: 800,
            color: colors.textPrimary,
            textAlign: "start"
          }}
        >
          {t("unsubscribe.title")}
        </h1>
        <p style={{ margin: "0 0 16px", fontSize: "15px", color: colors.textSecondary, lineHeight: 1.6, textAlign: "start" }}>
          {t("unsubscribe.intro")}
        </p>

        <div
          style={{
            margin: "0 0 20px",
            padding: "12px 14px",
            borderRadius: "10px",
            background: colors.primarySurface,
            border: `1px solid ${colors.primaryBorder}`,
            fontSize: "13px",
            color: colors.textSecondary,
            lineHeight: 1.6,
            textAlign: "start"
          }}
        >
          {t("unsubscribe.serviceNotice")}
        </div>

        {status === "success" ? (
          <div
            role="status"
            style={{
              padding: "14px 16px",
              borderRadius: "10px",
              background: colors.successSurface,
              border: `1px solid ${colors.successBorder}`,
              color: colors.success,
              fontSize: "14px",
              lineHeight: 1.6,
              textAlign: "start"
            }}
          >
            {t("unsubscribe.success")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <label style={labelStyle}>
              {t("unsubscribe.phoneLabel")}
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={22}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              {t("unsubscribe.emailLabel")}
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                style={inputStyle}
              />
            </label>

            {error ? (
              <div
                role="alert"
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: colors.errorSurface,
                  border: `1px solid ${colors.errorBorder}`,
                  color: colors.error,
                  fontSize: "13.5px"
                }}
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={status === "submitting"}
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                border: "none",
                background: status === "submitting" ? colors.border : colors.primary,
                color: status === "submitting" ? colors.textMuted : "#fff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: status === "submitting" ? "not-allowed" : "pointer"
              }}
            >
              {status === "submitting" ? t("unsubscribe.submitting") : t("unsubscribe.submit")}
            </button>

            <p style={{ margin: 0, fontSize: "12px", color: colors.textMuted, lineHeight: 1.6, textAlign: "start" }}>
              {t("unsubscribe.keywordsNote")}
            </p>
          </form>
        )}

        <div style={{ marginTop: "24px" }}>
          <Link to="/" style={{ color: colors.primary, fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>
            ← {t("meta.backHome")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default UnsubscribePage;
