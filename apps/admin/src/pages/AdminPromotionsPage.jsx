import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  setAnnouncementActive,
  archiveAnnouncement,
  deleteAnnouncement
} from "../services/announcementService";
import { getAdminProducts } from "../services/productService";
import { getAdminCategories } from "../services/categoryService";
import { pickLocalizedName, pickLocalizedProductName } from "../utils/localizedDisplayName";
import { useToast } from "../features/toast/ToastContext";

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  bg: "#faf8f5",
  surface: "#ffffff",
  border: "#e8e3dc",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  textInverse: "#ffffff",
  error: "#991b1b",
  errorBg: "#fef2f2",
  errorBorder: "#fecaca"
};

function toLocalDatetimeValue(iso) {
  const dt = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function emptyForm() {
  const now = new Date();
  const inOneWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  return {
    title: "",
    message: "",
    ctaType: "none",
    ctaTextHe: "",
    ctaTextEn: "",
    ctaTextAr: "",
    ctaProductId: "",
    ctaCategoryId: "",
    ctaUrl: "",
    startsAtLocal: toLocalDatetimeValue(now.toISOString()),
    scheduleMode: "duration",
    durationHours: "72",
    endsAtLocal: toLocalDatetimeValue(inOneWeek.toISOString()),
    isActive: false
  };
}

const AdminPromotionsPage = () => {
  const { t } = useTranslation(["promotions", "common"]);
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingArchive, setPendingArchive] = useState(null);
  const cancelRef = useRef(null);
  const imageInputRef = useRef(null);
  const [promoImageFile, setPromoImageFile] = useState(null);
  const [promoImageObjectUrl, setPromoImageObjectUrl] = useState(null);
  const [savedPromoImageUrl, setSavedPromoImageUrl] = useState("");
  const [removeSavedPromoImage, setRemoveSavedPromoImage] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, c] = await Promise.all([getAdminProducts(), getAdminCategories()]);
        if (!cancelled) {
          setProducts(Array.isArray(p) ? p : []);
          setCategories(Array.isArray(c) ? c : []);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setCategories([]);
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await listAnnouncements({ includeArchived: showArchived });
      setItems(rows);
    } catch (err) {
      setError(err.userMessage || t("promotions:loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [showArchived, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!promoImageFile) {
      setPromoImageObjectUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(promoImageFile);
    setPromoImageObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [promoImageFile]);

  useEffect(() => {
    if (!pendingDelete && !pendingArchive) return undefined;
    const t = requestAnimationFrame(() => cancelRef.current?.focus());
    const onKey = (e) => {
      if (e.key === "Escape") {
        setPendingDelete(null);
        setPendingArchive(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [pendingDelete, pendingArchive]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setPromoImageFile(null);
    setSavedPromoImageUrl("");
    setRemoveSavedPromoImage(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const onEdit = (row) => {
    if (row.archivedAt) return;
    setEditingId(row.id);
    setPromoImageFile(null);
    setSavedPromoImageUrl(row.imageUrl || "");
    setRemoveSavedPromoImage(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
    const cta = row.cta;
    const legacyLink = (row.buttonLink || "").trim();
    const legacyText = (row.buttonText || "").trim();
    let ctaFields;
    if (cta && cta.type && cta.type !== "none") {
      ctaFields = {
        ctaType: cta.type,
        ctaTextHe: cta.text?.he || "",
        ctaTextEn: cta.text?.en || "",
        ctaTextAr: cta.text?.ar || "",
        ctaProductId: cta.productId || "",
        ctaCategoryId: cta.categoryId || "",
        ctaUrl: cta.url || ""
      };
    } else if (legacyLink) {
      ctaFields = {
        ctaType: "custom",
        ctaTextHe: legacyText,
        ctaTextEn: legacyText,
        ctaTextAr: legacyText,
        ctaProductId: "",
        ctaCategoryId: "",
        ctaUrl: legacyLink
      };
    } else {
      ctaFields = {
        ctaType: "none",
        ctaTextHe: "",
        ctaTextEn: "",
        ctaTextAr: "",
        ctaProductId: "",
        ctaCategoryId: "",
        ctaUrl: ""
      };
    }
    setForm({
      title: row.title,
      message: row.message,
      ...ctaFields,
      startsAtLocal: toLocalDatetimeValue(row.startsAt),
      scheduleMode: "end",
      durationHours: "48",
      endsAtLocal: toLocalDatetimeValue(row.endsAt),
      isActive: !!row.isActive
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildSchedulePayload = () => {
    const startsAt = new Date(form.startsAtLocal).toISOString();
    if (form.scheduleMode === "duration") {
      const hours = Number(form.durationHours);
      if (!Number.isFinite(hours) || hours <= 0) {
        throw new Error(t("promotions:form.errors.schedule"));
      }
      return { startsAt, durationHours: hours };
    }
    const endsAt = new Date(form.endsAtLocal).toISOString();
    return { startsAt, endsAt };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let schedule;
      try {
        schedule = buildSchedulePayload();
      } catch (err) {
        showToast(err.message || t("promotions:form.errors.schedule"), "error");
        setSaving(false);
        return;
      }

      if (form.ctaType === "product" && !form.ctaProductId) {
        showToast(t("promotions:form.errors.ctaProduct"), "error");
        setSaving(false);
        return;
      }
      if (form.ctaType === "category" && !form.ctaCategoryId) {
        showToast(t("promotions:form.errors.ctaCategory"), "error");
        setSaving(false);
        return;
      }
      if (form.ctaType === "custom" && !form.ctaUrl.trim()) {
        showToast(t("promotions:form.errors.ctaUrl"), "error");
        setSaving(false);
        return;
      }

      const ctaPayload = {
        type: form.ctaType,
        text: {
          he: form.ctaTextHe.trim(),
          en: form.ctaTextEn.trim(),
          ar: form.ctaTextAr.trim()
        },
        productId: form.ctaType === "product" ? form.ctaProductId || null : null,
        categoryId: form.ctaType === "category" ? form.ctaCategoryId || null : null,
        url: form.ctaType === "custom" ? form.ctaUrl.trim() : ""
      };

      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("message", form.message.trim());
      fd.append("cta", JSON.stringify(ctaPayload));
      fd.append("isActive", String(!!form.isActive));
      fd.append("startsAt", schedule.startsAt);
      if (form.scheduleMode === "duration") {
        fd.append("durationHours", String(schedule.durationHours));
      } else {
        fd.append("endsAt", schedule.endsAt);
      }
      if (promoImageFile) {
        fd.append("image", promoImageFile);
      } else if (editingId && removeSavedPromoImage) {
        fd.append("removeImage", "true");
      }

      if (editingId) {
        await updateAnnouncement(editingId, fd);
        showToast(t("promotions:form.toasts.updated"));
      } else {
        await createAnnouncement(fd);
        showToast(t("promotions:form.toasts.created"));
        resetForm();
      }
      await load();
      if (editingId) resetForm();
    } catch (err) {
      showToast(err.userMessage || t("promotions:form.errors.saveFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (row) => {
    if (row.archivedAt) return;
    try {
      await setAnnouncementActive(row.id, !row.isActive);
      showToast(row.isActive ? t("promotions:form.toasts.turnedOff") : t("promotions:form.toasts.turnedOn"));
      await load();
    } catch (err) {
      showToast(err.userMessage || t("promotions:form.toasts.statusFailed"), "error");
    }
  };

  const confirmArchive = async () => {
    if (!pendingArchive) return;
    try {
      await archiveAnnouncement(pendingArchive.id);
      showToast(t("promotions:form.toasts.archived"));
      setPendingArchive(null);
      await load();
    } catch (err) {
      showToast(err.userMessage || t("promotions:form.toasts.archiveFailed"), "error");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteAnnouncement(pendingDelete.id);
      showToast(t("promotions:form.toasts.deleted"));
      setPendingDelete(null);
      await load();
    } catch (err) {
      showToast(err.userMessage || t("promotions:form.toasts.deleteFailed"), "error");
    }
  };

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [items]
  );

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: `1px solid ${colors.border}`,
    fontSize: "14px",
    boxSizing: "border-box",
    fontFamily: "inherit"
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: colors.textSecondary,
    marginBottom: "6px"
  };

  return (
    <div style={{ width: "100%", maxWidth: "960px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary, margin: "0 0 8px" }}>
        {t("promotions:pageTitle")}
      </h1>
      <p style={{ fontSize: "14px", color: colors.textMuted, margin: "0 0 24px", lineHeight: 1.5 }}>
        {t("promotions:pageSubtitle")}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap"
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          {t("promotions:showArchived")}
        </label>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "28px"
        }}
      >
        <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px", color: colors.textPrimary }}>
          {editingId ? t("promotions:form.titleEdit") : t("promotions:form.titleNew")}
        </div>

        <div style={{ display: "grid", gap: "14px" }}>
          <div>
            <label style={labelStyle}>{t("promotions:form.fields.title")}</label>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              maxLength={120}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("promotions:form.fields.message")}</label>
            <textarea
              style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              required
              maxLength={2000}
            />
          </div>
          <div>
            <label style={labelStyle}>{t("promotions:form.fields.image")}</label>
            <p style={{ fontSize: "13px", color: colors.textMuted, margin: "0 0 8px", lineHeight: 1.45 }}>
              {t("promotions:form.fields.imageHint")}
            </p>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              style={{ fontSize: "14px", maxWidth: "100%" }}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setPromoImageFile(f);
                if (f) setRemoveSavedPromoImage(false);
              }}
            />
            {(promoImageObjectUrl || (savedPromoImageUrl && !removeSavedPromoImage)) && (
              <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-start" }}>
                <img
                  src={promoImageObjectUrl || savedPromoImageUrl}
                  alt=""
                  style={{
                    width: "100%",
                    maxWidth: "280px",
                    maxHeight: "160px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    border: `1px solid ${colors.border}`
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {promoImageFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setPromoImageFile(null);
                        if (imageInputRef.current) imageInputRef.current.value = "";
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: `1px solid ${colors.border}`,
                        background: colors.bg,
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        alignSelf: "flex-start"
                      }}
                    >
                      {t("promotions:form.fields.clearNewSelection")}
                    </button>
                  )}
                  {editingId && savedPromoImageUrl && !promoImageFile && (
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={removeSavedPromoImage}
                        onChange={(e) => setRemoveSavedPromoImage(e.target.checked)}
                      />
                      {t("promotions:form.fields.removeSavedImage")}
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: "14px", marginTop: "4px" }}>
            <span style={labelStyle}>{t("promotions:form.fields.ctaSection")}</span>
            <p style={{ fontSize: "13px", color: colors.textMuted, margin: "4px 0 12px", lineHeight: 1.45 }}>
              {t("promotions:form.fields.ctaHint")}
            </p>
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={labelStyle}>{t("promotions:form.fields.ctaTarget")}</label>
                <select
                  style={inputStyle}
                  value={form.ctaType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ctaType: e.target.value,
                      ctaProductId: "",
                      ctaCategoryId: "",
                      ctaUrl: ""
                    }))
                  }
                >
                  <option value="none">{t("promotions:form.fields.ctaTargetOptions.none")}</option>
                  <option value="product">{t("promotions:form.fields.ctaTargetOptions.product")}</option>
                  <option value="category">{t("promotions:form.fields.ctaTargetOptions.category")}</option>
                  <option value="custom">{t("promotions:form.fields.ctaTargetOptions.custom")}</option>
                </select>
              </div>
              {form.ctaType !== "none" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>{t("promotions:form.fields.btnHe")}</label>
                      <input
                        style={inputStyle}
                        value={form.ctaTextHe}
                        onChange={(e) => setForm((f) => ({ ...f, ctaTextHe: e.target.value }))}
                        maxLength={80}
                        placeholder={t("promotions:form.fields.btnHePlaceholder")}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{t("promotions:form.fields.btnEn")}</label>
                      <input
                        style={inputStyle}
                        value={form.ctaTextEn}
                        onChange={(e) => setForm((f) => ({ ...f, ctaTextEn: e.target.value }))}
                        maxLength={80}
                        placeholder={t("promotions:form.fields.btnEnPlaceholder")}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{t("promotions:form.fields.btnAr")}</label>
                      <input
                        style={inputStyle}
                        value={form.ctaTextAr}
                        onChange={(e) => setForm((f) => ({ ...f, ctaTextAr: e.target.value }))}
                        maxLength={80}
                      />
                    </div>
                  </div>
                  {form.ctaType === "product" && (
                    <div>
                      <label style={labelStyle}>{t("promotions:form.fields.product")}</label>
                      <select
                        style={inputStyle}
                        value={form.ctaProductId}
                        onChange={(e) => setForm((f) => ({ ...f, ctaProductId: e.target.value }))}
                        required={form.ctaType === "product"}
                        disabled={catalogLoading}
                      >
                        <option value="">{catalogLoading ? t("promotions:form.fields.loadingProducts") : t("promotions:form.fields.selectProduct")}</option>
                        {[...products]
                          .sort((a, b) =>
                            pickLocalizedProductName(a).localeCompare(pickLocalizedProductName(b), undefined, {
                              sensitivity: "base"
                            })
                          )
                          .map((p) => (
                            <option key={p._id} value={p._id}>
                              {pickLocalizedProductName(p)}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  {form.ctaType === "category" && (
                    <div>
                      <label style={labelStyle}>{t("promotions:form.fields.category")}</label>
                      <select
                        style={inputStyle}
                        value={form.ctaCategoryId}
                        onChange={(e) => setForm((f) => ({ ...f, ctaCategoryId: e.target.value }))}
                        required={form.ctaType === "category"}
                        disabled={catalogLoading}
                      >
                        <option value="">{catalogLoading ? t("promotions:form.fields.loadingCategories") : t("promotions:form.fields.selectCategory")}</option>
                        {[...categories]
                          .sort((a, b) =>
                            pickLocalizedProductName(a).localeCompare(pickLocalizedProductName(b), undefined, {
                              sensitivity: "base"
                            })
                          )
                          .map((c) => (
                            <option key={c._id} value={c._id}>
                              {pickLocalizedName(c.name)}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  {form.ctaType === "custom" && (
                    <div>
                      <label style={labelStyle}>{t("promotions:form.fields.urlOrPath")}</label>
                      <input
                        style={inputStyle}
                        value={form.ctaUrl}
                        onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                        placeholder={t("promotions:form.fields.urlOrPathPlaceholder")}
                        maxLength={2000}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t("promotions:form.fields.startsAt")}</label>
            <input
              type="datetime-local"
              style={inputStyle}
              value={form.startsAtLocal}
              onChange={(e) => setForm((f) => ({ ...f, startsAtLocal: e.target.value }))}
              required
            />
          </div>

          <div>
            <span style={labelStyle}>{t("promotions:form.fields.scheduleSection")}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="scheduleMode"
                  checked={form.scheduleMode === "duration"}
                  onChange={() => setForm((f) => ({ ...f, scheduleMode: "duration" }))}
                />
                {t("promotions:form.fields.scheduleDuration")}
              </label>
              {form.scheduleMode === "duration" && (
                <input
                  type="number"
                  min={1}
                  max={8760}
                  step={1}
                  style={{ ...inputStyle, maxWidth: "200px" }}
                  value={form.durationHours}
                  onChange={(e) => setForm((f) => ({ ...f, durationHours: e.target.value }))}
                />
              )}
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="scheduleMode"
                  checked={form.scheduleMode === "end"}
                  onChange={() => setForm((f) => ({ ...f, scheduleMode: "end" }))}
                />
                {t("promotions:form.fields.scheduleEnd")}
              </label>
              {form.scheduleMode === "end" && (
                <input
                  type="datetime-local"
                  style={inputStyle}
                  value={form.endsAtLocal}
                  onChange={(e) => setForm((f) => ({ ...f, endsAtLocal: e.target.value }))}
                  required={form.scheduleMode === "end"}
                />
              )}
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            {t("promotions:form.fields.activeCheckbox")}
          </label>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: colors.primary,
              color: colors.textInverse,
              fontWeight: 600,
              fontSize: "14px",
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.75 : 1
            }}
          >
            {saving ? t("promotions:form.buttons.saving") : editingId ? t("promotions:form.buttons.submitEdit") : t("promotions:form.buttons.submitNew")}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              {t("promotions:form.buttons.cancelEdit")}
            </button>
          )}
        </div>
      </form>

      {loading && <p style={{ color: colors.textMuted }}>{t("common:loading")}</p>}
      {error && (
        <p style={{ color: colors.error, background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, padding: "12px", borderRadius: "10px" }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", background: colors.surface, borderRadius: "12px", overflow: "hidden", border: `1px solid ${colors.border}` }}>
            <thead>
              <tr style={{ background: colors.bg, textAlign: "left" }}>
                <th style={{ padding: "12px", fontWeight: 700 }}>{t("promotions:table.title")}</th>
                <th style={{ padding: "12px", fontWeight: 700 }}>{t("promotions:table.window")}</th>
                <th style={{ padding: "12px", fontWeight: 700 }}>{t("promotions:table.status")}</th>
                <th style={{ padding: "12px", fontWeight: 700 }}>{t("promotions:table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "20px", color: colors.textMuted }}>
                    {t("promotions:table.empty")}
                  </td>
                </tr>
              )}
              {sorted.map((row) => {
                const archived = !!row.archivedAt;
                const start = new Date(row.startsAt).toLocaleString();
                const end = new Date(row.endsAt).toLocaleString();
                return (
                  <tr key={row.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                    <td style={{ padding: "12px", fontWeight: 600, verticalAlign: "top" }}>{row.title}</td>
                    <td style={{ padding: "12px", color: colors.textSecondary, verticalAlign: "top", whiteSpace: "nowrap" }}>
                      {start}
                      <br />
                      → {end}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      {archived ? (
                        <span style={{ color: colors.textMuted }}>{t("promotions:row.archived")}</span>
                      ) : row.isActive ? (
                        <span style={{ color: colors.primary, fontWeight: 600 }}>{t("promotions:row.on")}</span>
                      ) : (
                        <span style={{ color: colors.textMuted }}>{t("promotions:row.off")}</span>
                      )}
                    </td>
                    <td style={{ padding: "12px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {!archived && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(row)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: `1px solid ${colors.border}`,
                                background: colors.bg,
                                fontSize: "12px",
                                cursor: "pointer"
                              }}
                            >
                              {row.isActive ? t("promotions:row.turnOff") : t("promotions:row.turnOn")}
                            </button>
                            <button
                              type="button"
                              onClick={() => onEdit(row)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: `1px solid ${colors.border}`,
                                background: colors.bg,
                                fontSize: "12px",
                                cursor: "pointer"
                              }}
                            >
                              {t("promotions:row.edit")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingArchive(row)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: `1px solid ${colors.border}`,
                                background: colors.bg,
                                fontSize: "12px",
                                cursor: "pointer"
                              }}
                            >
                              {t("promotions:row.archive")}
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setPendingDelete(row)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            border: `1px solid ${colors.errorBorder}`,
                            background: colors.errorBg,
                            color: colors.error,
                            fontSize: "12px",
                            cursor: "pointer"
                          }}
                        >
                          {t("promotions:row.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(pendingDelete || pendingArchive) && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28,25,23,0.45)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{
              background: colors.surface,
              borderRadius: "14px",
              padding: "22px",
              maxWidth: "400px",
              width: "100%",
              border: `1px solid ${colors.border}`
            }}
          >
            <p style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 600 }}>
              {pendingDelete ? t("promotions:modal.deleteTitle") : t("promotions:modal.archiveTitle")}
            </p>
            <p style={{ margin: "0 0 18px", fontSize: "14px", color: colors.textSecondary, lineHeight: 1.5 }}>
              {pendingDelete
                ? t("promotions:modal.deleteBody")
                : t("promotions:modal.archiveBody")}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                ref={cancelRef}
                onClick={() => {
                  setPendingDelete(null);
                  setPendingArchive(null);
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                {t("promotions:modal.cancel")}
              </button>
              <button
                type="button"
                onClick={pendingDelete ? confirmDelete : confirmArchive}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: pendingDelete ? colors.error : colors.primary,
                  color: colors.textInverse,
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                {pendingDelete ? t("promotions:modal.confirmDelete") : t("promotions:modal.confirmArchive")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromotionsPage;
