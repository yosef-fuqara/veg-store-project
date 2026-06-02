import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";
import { accountCardStyle, accountColors } from "../../features/account/accountTheme";
import * as accountService from "../../services/accountService";

const AccountWhatsAppPage = () => {
  const { t, i18n } = useTranslation("account");
  const { user, updateUser } = useAuth();
  const lang = (i18n.language || "he").split("-")[0];
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const consent = user?.marketingConsentWhatsApp === true;

  const formatConsentDate = (value) => {
    if (!value) return null;
    try {
      return new Intl.DateTimeFormat(lang === "he" ? "he-IL" : lang === "ar" ? "ar" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    } catch {
      return null;
    }
  };

  const handleToggle = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const next = await accountService.updateMarketingConsent(!consent);
      updateUser(next);
      setMessage(t("whatsapp.saved"));
    } catch (err) {
      setError(err.userMessage || t("profile.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const consentDate = formatConsentDate(user?.marketingConsentWhatsAppAt);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 700, color: accountColors.textPrimary }}>{t("whatsapp.title")}</h2>
        <p style={{ margin: 0, fontSize: "15px", color: accountColors.textSecondary, lineHeight: 1.5 }}>{t("whatsapp.subtitle")}</p>
      </div>

      {message ? (
        <div role="status" style={{ padding: "12px 16px", borderRadius: "10px", background: accountColors.successSurface, border: `1px solid ${accountColors.successBorder}`, color: accountColors.success, fontSize: "14px" }}>
          {message}
        </div>
      ) : null}
      {error ? (
        <div role="alert" style={{ padding: "12px 16px", borderRadius: "10px", background: accountColors.errorSurface, border: `1px solid ${accountColors.errorBorder}`, color: accountColors.error, fontSize: "14px" }}>
          {error}
        </div>
      ) : null}

      <div style={accountCardStyle}>
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            cursor: busy ? "wait" : "pointer",
            opacity: busy ? 0.7 : 1
          }}
        >
          <input
            type="checkbox"
            checked={consent}
            disabled={busy}
            onChange={handleToggle}
            style={{ width: "20px", height: "20px", marginTop: "2px", accentColor: accountColors.primary, flexShrink: 0 }}
          />
          <span>
            <span style={{ display: "block", fontSize: "16px", fontWeight: 600, color: accountColors.textPrimary, marginBottom: "6px" }}>
              {t("whatsapp.toggleLabel")}
            </span>
            <span style={{ display: "block", fontSize: "14px", color: accountColors.textSecondary, lineHeight: 1.5 }}>
              {t("whatsapp.toggleHint")}
            </span>
            {consent && consentDate ? (
              <span style={{ display: "block", marginTop: "10px", fontSize: "13px", color: accountColors.textMuted }}>
                {t("whatsapp.consentDate", { date: consentDate })}
              </span>
            ) : null}
          </span>
        </label>
      </div>
    </div>
  );
};

export default AccountWhatsAppPage;
