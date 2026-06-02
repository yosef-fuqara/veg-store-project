import { useEffect, useState } from "react";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import {
  getMarketingRecipientsCount,
  previewMarketingCampaign,
  sendMarketingCampaign
} from "../services/marketingCampaignService";
import { formatApiError } from "../utils/formatApiError";

const colors = {
  primary: "#1e6b3c",
  bg: "#faf8f5",
  surface: "#ffffff",
  border: "#e8e3dc",
  borderLight: "#f0ece6",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  textInverse: "#ffffff",
  success: "#166534",
  successBg: "#dcfce7",
  successBorder: "#bbf7d0",
  error: "#991b1b",
  errorBg: "#fef2f2",
  errorBorder: "#fecaca"
};

const baseInputStyle = {
  width: "100%",
  borderRadius: "10px",
  border: `1px solid ${colors.border}`,
  padding: "10px 12px",
  fontFamily: "inherit",
  fontSize: "14px",
  color: colors.textPrimary,
  background: colors.surface,
  boxSizing: "border-box"
};

const AdminMarketingCampaignsPage = () => {
  const [form, setForm] = useState({ title: "", message: "" });
  const [recipientCount, setRecipientCount] = useState(0);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadingCount, setLoadingCount] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canPreview = form.message.trim().length > 0 && !busy;

  const canSend =
    canPreview &&
    Number(preview?.recipientCount) > 0 &&
    preview?.title === form.title.trim() &&
    preview?.previewMessage &&
    !busy;

  const loadRecipientCount = async () => {
    setLoadingCount(true);
    try {
      const count = await getMarketingRecipientsCount();
      setRecipientCount(count);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoadingCount(false);
    }
  };

  useEffect(() => {
    void loadRecipientCount();
  }, []);

  const handlePreview = async () => {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const data = await previewMarketingCampaign({
        title: form.title.trim(),
        message: form.message.trim()
      });
      setPreview(data);
    } catch (err) {
      setPreview(null);
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    if (!preview?.recipientCount) {
      setError("No recipients available.");
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to send this campaign to ${preview.recipientCount} customers?`
    );
    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const campaign = await sendMarketingCampaign({
        title: form.title.trim(),
        message: form.message.trim()
      });
      setSuccess(
        `WhatsApp campaign sent. Delivered: ${campaign.recipientCount - campaign.failedRecipients}/${campaign.recipientCount}.`
      );
      await loadRecipientCount();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: "980px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.3px" }}>
          Marketing Campaigns
        </h1>
        <p style={{ margin: "6px 0 0", color: colors.textSecondary, fontSize: "14px" }}>
          Send promotional WhatsApp messages only to customers who opted in to marketing updates.
        </p>
      </div>

      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "16px"
        }}
      >
        <div style={{ display: "grid", gap: "14px" }}>
          <label style={{ fontSize: "13px", color: colors.textSecondary, fontWeight: 600 }}>
            Campaign title
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Weekly fresh arrivals"
              style={{ ...baseInputStyle, marginTop: "6px" }}
            />
          </label>

          <label style={{ fontSize: "13px", color: colors.textSecondary, fontWeight: 600 }}>
            Message body
            <textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              rows={6}
              placeholder="Fresh produce just arrived. Order today and enjoy seasonal specials."
              style={{ ...baseInputStyle, marginTop: "6px", resize: "vertical", minHeight: "130px" }}
            />
          </label>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: colors.textSecondary,
              padding: "8px 12px",
              borderRadius: "10px",
              background: colors.bg,
              border: `1px solid ${colors.borderLight}`,
              width: "fit-content"
            }}
          >
            <MessageCircle size={16} color={colors.primary} />
            <span>
              Channel: <strong style={{ color: colors.textPrimary }}>WhatsApp</strong>
            </span>
          </div>
        </div>

        <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handlePreview}
            disabled={!canPreview}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              color: colors.textPrimary,
              fontSize: "13px",
              fontWeight: 700,
              cursor: canPreview ? "pointer" : "not-allowed",
              opacity: canPreview ? 1 : 0.7,
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px"
            }}
          >
            <Sparkles size={14} />
            Preview
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: canSend ? colors.primary : colors.border,
              color: canSend ? colors.textInverse : colors.textMuted,
              fontSize: "13px",
              fontWeight: 700,
              cursor: canSend ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px"
            }}
          >
            <Send size={14} />
            Send campaign
          </button>
        </div>
      </div>

      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: "14px",
          padding: "18px"
        }}
      >
        <h2 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 800, color: colors.textPrimary }}>
          Campaign preview
        </h2>
        <div style={{ display: "grid", gap: "8px", marginBottom: "12px" }}>
          <div style={{ color: colors.textSecondary, fontSize: "13px" }}>
            Total recipients:{" "}
            <strong style={{ color: colors.textPrimary }}>
              {loadingCount ? "Loading..." : preview?.recipientCount ?? recipientCount}
            </strong>
          </div>
          <div style={{ color: colors.textSecondary, fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <MessageCircle size={16} />
            <strong style={{ color: colors.textPrimary }}>WhatsApp</strong>
          </div>
        </div>

        <div
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: `1px solid ${colors.borderLight}`,
            background: colors.bg,
            color: colors.textPrimary,
            fontSize: "14px",
            lineHeight: 1.45,
            whiteSpace: "pre-wrap"
          }}
        >
          {preview?.previewMessage || "Click Preview to review the final WhatsApp message before sending."}
        </div>
      </div>

      {error ? (
        <div role="alert" style={{ marginTop: "14px", padding: "10px 12px", borderRadius: "10px", border: `1px solid ${colors.errorBorder}`, background: colors.errorBg, color: colors.error, fontSize: "13px" }}>
          {error}
        </div>
      ) : null}

      {success ? (
        <div role="status" style={{ marginTop: "14px", padding: "10px 12px", borderRadius: "10px", border: `1px solid ${colors.successBorder}`, background: colors.successBg, color: colors.success, fontSize: "13px" }}>
          {success}
        </div>
      ) : null}
    </div>
  );
};

export default AdminMarketingCampaignsPage;
