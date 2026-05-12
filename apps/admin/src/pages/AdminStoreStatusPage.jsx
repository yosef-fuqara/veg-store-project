import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import * as storeSettingsService from "../services/storeSettingsService";
import { formatApiError } from "../utils/formatApiError";

const colors = {
  primary: "#1e6b3c",
  primarySurface: "#eef7f1",
  primaryBorder: "#a3cfb4",
  surface: "#ffffff",
  border: "#e8e3dc",
  textPrimary: "#1c1917",
  textMuted: "#a8a29e",
  error: "#991b1b",
  errorSurface: "#fef2f2",
  errorBorder: "#fecaca"
};

const AdminStoreStatusPage = () => {
  const { t } = useTranslation(["storeStatus", "common"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [closedTitle, setClosedTitle] = useState({ he: "", en: "", ar: "" });
  const [operatingHoursEnabled, setOperatingHoursEnabled] = useState(false);
  const [operatingTimezone, setOperatingTimezone] = useState("Asia/Jerusalem");
  const [operatingOpenLocal, setOperatingOpenLocal] = useState("09:00");
  const [operatingCloseLocal, setOperatingCloseLocal] = useState("21:00");
  const [manualOpen, setManualOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const s = await storeSettingsService.getStoreSettings();
      setClosedTitle({
        he: s?.closedTitle?.he ?? "",
        en: s?.closedTitle?.en ?? "",
        ar: s?.closedTitle?.ar ?? ""
      });
      setOperatingHoursEnabled(s?.operatingHoursEnabled === true);
      setOperatingTimezone(
        typeof s?.operatingTimezone === "string" && s.operatingTimezone.trim()
          ? s.operatingTimezone.trim()
          : "Asia/Jerusalem"
      );
      setOperatingOpenLocal(s?.operatingOpenLocal || "09:00");
      setOperatingCloseLocal(s?.operatingCloseLocal || "21:00");
      setManualOpen(s?.isStoreOpen !== false);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await storeSettingsService.patchStoreSettings({
        closedTitle,
        operatingHoursEnabled,
        operatingTimezone,
        operatingOpenLocal,
        operatingCloseLocal
      });
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (label, value, onChange) => (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        color: colors.textPrimary
      }}
    >
      {label}
      <input
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: `1px solid ${colors.border}`,
          fontSize: 14,
          fontFamily: "inherit"
        }}
      />
    </label>
  );

  if (loading) {
    return <div style={{ color: colors.textMuted, fontSize: 15 }}>{t("common:loading")}</div>;
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 700, color: colors.textPrimary }}>
        {t("pageTitle")}
      </h1>
      <p style={{ margin: "0 0 16px", color: colors.textMuted, fontSize: 14, lineHeight: 1.55 }}>
        {t("pageSubtitle")}
      </p>

      <div
        style={{
          marginBottom: 20,
          padding: "14px 16px",
          borderRadius: 12,
          background: colors.primarySurface,
          border: `1px solid ${colors.primaryBorder}`,
          fontSize: 15,
          fontWeight: 600,
          color: colors.textPrimary,
          lineHeight: 1.5
        }}
      >
        <span>{manualOpen ? t("storeOpenLabel") : t("storeClosedLabel")}</span>
      </div>

      {error ? (
        <div
          role="alert"
          style={{
            marginBottom: 20,
            padding: "12px 14px",
            borderRadius: 10,
            background: colors.errorSurface,
            border: `1px solid ${colors.errorBorder}`,
            color: colors.error,
            fontSize: 14
          }}
        >
          {error}
        </div>
      ) : null}

      <form
        onSubmit={onSave}
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20
        }}
      >
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: colors.textPrimary }}>
          {t("operatingSection.title")}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>
          {t("operatingSection.subtitle")}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap"
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600 }}>{t("operatingSection.toggleLabel")}</span>
          <button
            type="button"
            role="switch"
            aria-checked={operatingHoursEnabled}
            onClick={() => setOperatingHoursEnabled((v) => !v)}
            style={{
              width: 52,
              height: 28,
              borderRadius: 999,
              border: "none",
              background: operatingHoursEnabled ? colors.primary : "#d6d3d1",
              position: "relative",
              cursor: "pointer",
              flexShrink: 0
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                insetInlineStart: operatingHoursEnabled ? 26 : 3,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "inset-inline-start 0.2s ease"
              }}
            />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {field(t("operatingSection.timezone"), operatingTimezone, setOperatingTimezone)}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: colors.textPrimary
              }}
            >
              {t("operatingSection.openTime")}
              <input
                type="time"
                value={operatingOpenLocal}
                onChange={(ev) => setOperatingOpenLocal(ev.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  fontSize: 14,
                  fontFamily: "inherit"
                }}
              />
            </label>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: colors.textPrimary
              }}
            >
              {t("operatingSection.closeTime")}
              <input
                type="time"
                value={operatingCloseLocal}
                onChange={(ev) => setOperatingCloseLocal(ev.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  fontSize: 14,
                  fontFamily: "inherit"
                }}
              />
            </label>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: colors.textMuted, lineHeight: 1.45 }}>
            {t("operatingSection.hoursExplain")}
          </p>
        </div>

        <h2 style={{ margin: "8px 0 0", fontSize: 17, fontWeight: 700, color: colors.textPrimary }}>
          {t("closedMessageSection.title")}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {field(t("closedMessageSection.fieldHe"), closedTitle.he, (v) => setClosedTitle((p) => ({ ...p, he: v })))}
          {field(t("closedMessageSection.fieldEn"), closedTitle.en, (v) => setClosedTitle((p) => ({ ...p, en: v })))}
          {field(t("closedMessageSection.fieldAr"), closedTitle.ar, (v) => setClosedTitle((p) => ({ ...p, ar: v })))}
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            alignSelf: "flex-start",
            padding: "12px 28px",
            borderRadius: 10,
            border: "none",
            background: colors.primary,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.85 : 1
          }}
        >
          {saving ? t("buttons.saving") : t("buttons.save")}
        </button>
      </form>
    </div>
  );
};

export default AdminStoreStatusPage;
