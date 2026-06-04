import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { accountCardStyle, accountColors } from "../../features/account/accountTheme";
import { LEGAL_ROUTES } from "../../config/legalVersions";
import * as accountService from "../../services/accountService";

const formatDate = (value, lang) => {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(
      lang === "he" ? "he-IL" : lang === "ar" ? "ar" : "en-US",
      { dateStyle: "medium", timeStyle: "short" }
    ).format(new Date(value));
  } catch {
    return null;
  }
};

const sectionTitleStyle = {
  margin: "0 0 4px",
  fontSize: "16px",
  fontWeight: 700,
  color: accountColors.textPrimary
};

const noteStyle = {
  margin: 0,
  fontSize: "13px",
  color: accountColors.textMuted,
  lineHeight: 1.5
};

const buttonStyle = (variant = "primary", busy = false) => ({
  alignSelf: "flex-start",
  padding: "10px 18px",
  borderRadius: "10px",
  border: variant === "outline" ? `1.5px solid ${accountColors.border}` : "none",
  background:
    variant === "outline"
      ? "transparent"
      : variant === "danger"
        ? "#991b1b"
        : accountColors.primary,
  color: variant === "outline" ? accountColors.textPrimary : "#fff",
  fontSize: "14px",
  fontWeight: 600,
  cursor: busy ? "wait" : "pointer",
  opacity: busy ? 0.7 : 1
});

const AccountPrivacyPage = () => {
  const { t, i18n } = useTranslation(["legal", "account"]);
  const { user, updateUser } = useAuth();
  const lang = (i18n.language || "he").split("-")[0];

  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deletionRequested, setDeletionRequested] = useState(false);

  const marketingConsent =
    user?.marketing?.consent === true || user?.marketingConsentWhatsApp === true;
  const clubJoined = user?.customerClub?.joined === true;
  const savedDetailsOn = user?.savedDetails?.saveForNextOrder === true;
  const consentDate = formatDate(
    user?.marketing?.consentAt || user?.marketingConsentWhatsAppAt,
    lang
  );
  const clubJoinedDate = formatDate(user?.customerClub?.joinedAt, lang);

  const run = async (key, fn, successKey) => {
    setBusy(key);
    setError("");
    setMessage("");
    try {
      const result = await fn();
      if (result) updateUser(result);
      setMessage(t(successKey || "account.saved"));
    } catch (err) {
      setError(err.userMessage || t("account.saveError"));
    } finally {
      setBusy("");
    }
  };

  const handleToggleMarketing = () =>
    run("marketing", () => accountService.updateMarketingConsent(!marketingConsent, lang));
  const handleJoinClub = () =>
    run("club", () => accountService.joinCustomerClub(lang));
  const handleLeaveClub = () =>
    run("club", () => accountService.leaveCustomerClub());
  const handleDeleteSaved = () =>
    run("saved", () => accountService.deleteSavedDeliveryDetails());

  const handleRequestDeletion = async () => {
    setBusy("deletion");
    setError("");
    setMessage("");
    try {
      await accountService.requestAccountDeletion();
      setDeletionRequested(true);
      setMessage(t("account.deletionRequested"));
    } catch (err) {
      setError(err.userMessage || t("account.saveError"));
    } finally {
      setBusy("");
    }
  };

  const linkStyle = { color: accountColors.primary, fontWeight: 600 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 700, color: accountColors.textPrimary }}>
          {t("account.title")}
        </h2>
        <p style={{ margin: 0, fontSize: "15px", color: accountColors.textSecondary, lineHeight: 1.5 }}>
          {t("account.subtitle")}
        </p>
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

      {/* Marketing */}
      <div style={{ ...accountCardStyle, display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={sectionTitleStyle}>{t("account.marketingTitle")}</h3>
        <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: busy === "marketing" ? "wait" : "pointer" }}>
          <input
            type="checkbox"
            checked={marketingConsent}
            disabled={busy === "marketing"}
            onChange={handleToggleMarketing}
            style={{ width: "20px", height: "20px", marginTop: "2px", accentColor: accountColors.primary, flexShrink: 0 }}
          />
          <span>
            <span style={{ display: "block", fontSize: "15px", fontWeight: 600, color: accountColors.textPrimary, marginBottom: "4px" }}>
              {t("account.marketingToggle")}
            </span>
            <span style={{ display: "block", fontSize: "13px", color: accountColors.textSecondary, lineHeight: 1.5 }}>
              {t("account.marketingHint")}
            </span>
            <span style={{ display: "block", marginTop: "8px", fontSize: "13px", color: accountColors.textMuted }}>
              {marketingConsent ? t("account.marketingStatusOn") : t("account.marketingStatusOff")}
              {marketingConsent && consentDate ? ` · ${t("account.marketingConsentDate", { date: consentDate })}` : ""}
            </span>
          </span>
        </label>
      </div>

      {/* Customer club */}
      <div style={{ ...accountCardStyle, display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={sectionTitleStyle}>{t("account.clubTitle")}</h3>
        <p style={{ margin: 0, fontSize: "14px", color: accountColors.textSecondary, lineHeight: 1.5 }}>
          {clubJoined ? t("account.clubStatusJoined") : t("account.clubStatusNotJoined")}
          {clubJoined && clubJoinedDate ? ` · ${t("account.clubJoinedDate", { date: clubJoinedDate })}` : ""}
        </p>
        <p style={noteStyle}>
          <Link to={LEGAL_ROUTES.customerClub} style={linkStyle}>{t("footer.customerClub")}</Link>
        </p>
        {clubJoined ? (
          <>
            <button type="button" onClick={handleLeaveClub} disabled={busy === "club"} style={buttonStyle("outline", busy === "club")}>
              {t("account.leaveClub")}
            </button>
            <p style={noteStyle}>{t("account.clubLeaveNote")}</p>
          </>
        ) : (
          <button type="button" onClick={handleJoinClub} disabled={busy === "club"} style={buttonStyle("primary", busy === "club")}>
            {t("account.joinClub")}
          </button>
        )}
      </div>

      {/* Saved details */}
      <div style={{ ...accountCardStyle, display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={sectionTitleStyle}>{t("account.savedDetailsTitle")}</h3>
        <p style={{ margin: 0, fontSize: "14px", color: accountColors.textSecondary, lineHeight: 1.5 }}>
          {savedDetailsOn ? t("account.savedDetailsOn") : t("account.savedDetailsOff")}
        </p>
        <button type="button" onClick={handleDeleteSaved} disabled={busy === "saved"} style={buttonStyle("outline", busy === "saved")}>
          {t("account.deleteSavedDetails")}
        </button>
        <p style={noteStyle}>{t("account.deleteSavedDetailsNote")}</p>
      </div>

      {/* Account / data deletion */}
      <div style={{ ...accountCardStyle, display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={sectionTitleStyle}>{t("account.deletionTitle")}</h3>
        <p style={{ margin: 0, fontSize: "14px", color: accountColors.textSecondary, lineHeight: 1.5 }}>
          {t("account.deletionBody")}
        </p>
        {!deletionRequested ? (
          <button type="button" onClick={handleRequestDeletion} disabled={busy === "deletion"} style={buttonStyle("danger", busy === "deletion")}>
            {t("account.requestDeletion")}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default AccountPrivacyPage;
