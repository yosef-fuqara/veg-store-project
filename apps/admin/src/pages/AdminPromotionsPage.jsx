import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { pickLocalizedName } from "../utils/localizedDisplayName";
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
      setError(err.userMessage || "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

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
        throw new Error("Duration must be a positive number of hours");
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
        showToast(err.message || "Check schedule fields", "error");
        setSaving(false);
        return;
      }

      if (form.ctaType === "product" && !form.ctaProductId) {
        showToast("Choose a product for the CTA.", "error");
        setSaving(false);
        return;
      }
      if (form.ctaType === "category" && !form.ctaCategoryId) {
        showToast("Choose a category for the CTA.", "error");
        setSaving(false);
        return;
      }
      if (form.ctaType === "custom" && !form.ctaUrl.trim()) {
        showToast("Enter a URL or path for the CTA.", "error");
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
        showToast("Promotion updated.");
      } else {
        await createAnnouncement(fd);
        showToast("Promotion created.");
        resetForm();
      }
      await load();
      if (editingId) resetForm();
    } catch (err) {
      showToast(err.userMessage || "Could not save promotion", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (row) => {
    if (row.archivedAt) return;
    try {
      await setAnnouncementActive(row.id, !row.isActive);
      showToast(row.isActive ? "Promotion turned off." : "Promotion turned on.");
      await load();
    } catch (err) {
      showToast(err.userMessage || "Could not update status", "error");
    }
  };

  const confirmArchive = async () => {
    if (!pendingArchive) return;
    try {
      await archiveAnnouncement(pendingArchive.id);
      showToast("Promotion archived.");
      setPendingArchive(null);
      await load();
    } catch (err) {
      showToast(err.userMessage || "Could not archive", "error");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteAnnouncement(pendingDelete.id);
      showToast("Promotion deleted.");
      setPendingDelete(null);
      await load();
    } catch (err) {
      showToast(err.userMessage || "Could not delete", "error");
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
        Popups / Promotions
      </h1>
      <p style={{ fontSize: "14px", color: colors.textMuted, margin: "0 0 24px", lineHeight: 1.5 }}>
        Create storefront popups with a start time and either an end time or a duration. Only one active,
        in-window promotion is shown to customers at a time (the most recently updated match wins).
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
          Show archived
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
          {editingId ? "Edit promotion" : "New promotion"}
        </div>

        <div style={{ display: "grid", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              maxLength={120}
            />
          </div>
          <div>
            <label style={labelStyle}>Message</label>
            <textarea
              style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              required
              maxLength={2000}
            />
          </div>
          <div>
            <label style={labelStyle}>Promotion image (optional)</label>
            <p style={{ fontSize: "13px", color: colors.textMuted, margin: "0 0 8px", lineHeight: 1.45 }}>
              JPEG, PNG, or WebP up to 3&nbsp;MB. You can choose a file from this device; on a phone the gallery or
              camera may open depending on your browser.
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
                      Clear new selection
                    </button>
                  )}
                  {editingId && savedPromoImageUrl && !promoImageFile && (
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={removeSavedPromoImage}
                        onChange={(e) => setRemoveSavedPromoImage(e.target.checked)}
                      />
                      Remove saved image
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: "14px", marginTop: "4px" }}>
            <span style={labelStyle}>Call-to-action button</span>
            <p style={{ fontSize: "13px", color: colors.textMuted, margin: "4px 0 12px", lineHeight: 1.45 }}>
              Optional. Send customers to a product, a category, or any path or external link. Button labels can be
              set per language (Hebrew, English, Arabic).
            </p>
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <label style={labelStyle}>CTA target</label>
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
                  <option value="none">No button</option>
                  <option value="product">Product</option>
                  <option value="category">Category</option>
                  <option value="custom">Custom link or path</option>
                </select>
              </div>
              {form.ctaType !== "none" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>Button text (HE)</label>
                      <input
                        style={inputStyle}
                        value={form.ctaTextHe}
                        onChange={(e) => setForm((f) => ({ ...f, ctaTextHe: e.target.value }))}
                        maxLength={80}
                        placeholder="למשל קנו עכשיו"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Button text (EN)</label>
                      <input
                        style={inputStyle}
                        value={form.ctaTextEn}
                        onChange={(e) => setForm((f) => ({ ...f, ctaTextEn: e.target.value }))}
                        maxLength={80}
                        placeholder="e.g. Shop now"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Button text (AR)</label>
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
                      <label style={labelStyle}>Product</label>
                      <select
                        style={inputStyle}
                        value={form.ctaProductId}
                        onChange={(e) => setForm((f) => ({ ...f, ctaProductId: e.target.value }))}
                        required={form.ctaType === "product"}
                        disabled={catalogLoading}
                      >
                        <option value="">{catalogLoading ? "Loading products…" : "Select a product"}</option>
                        {[...products]
                          .sort((a, b) =>
                            pickLocalizedName(a.name).localeCompare(pickLocalizedName(b.name), undefined, {
                              sensitivity: "base"
                            })
                          )
                          .map((p) => (
                            <option key={p._id} value={p._id}>
                              {pickLocalizedName(p.name)}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  {form.ctaType === "category" && (
                    <div>
                      <label style={labelStyle}>Category</label>
                      <select
                        style={inputStyle}
                        value={form.ctaCategoryId}
                        onChange={(e) => setForm((f) => ({ ...f, ctaCategoryId: e.target.value }))}
                        required={form.ctaType === "category"}
                        disabled={catalogLoading}
                      >
                        <option value="">{catalogLoading ? "Loading categories…" : "Select a category"}</option>
                        {[...categories]
                          .sort((a, b) =>
                            pickLocalizedName(a.name).localeCompare(pickLocalizedName(b.name), undefined, {
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
                      <label style={labelStyle}>URL or path</label>
                      <input
                        style={inputStyle}
                        value={form.ctaUrl}
                        onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                        placeholder="https://… or /cart"
                        maxLength={2000}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Starts at</label>
            <input
              type="datetime-local"
              style={inputStyle}
              value={form.startsAtLocal}
              onChange={(e) => setForm((f) => ({ ...f, startsAtLocal: e.target.value }))}
              required
            />
          </div>

          <div>
            <span style={labelStyle}>How long it stays valid</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="scheduleMode"
                  checked={form.scheduleMode === "duration"}
                  onChange={() => setForm((f) => ({ ...f, scheduleMode: "duration" }))}
                />
                Run for a number of hours from start
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
                End at specific date &amp; time
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
            Active (visible on storefront when inside the time window)
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
            {saving ? "Saving…" : editingId ? "Save changes" : "Create promotion"}
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
              Cancel edit
            </button>
          )}
        </div>
      </form>

      {loading && <p style={{ color: colors.textMuted }}>Loading…</p>}
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
                <th style={{ padding: "12px", fontWeight: 700 }}>Title</th>
                <th style={{ padding: "12px", fontWeight: 700 }}>Window</th>
                <th style={{ padding: "12px", fontWeight: 700 }}>Status</th>
                <th style={{ padding: "12px", fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "20px", color: colors.textMuted }}>
                    No promotions yet.
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
                        <span style={{ color: colors.textMuted }}>Archived</span>
                      ) : row.isActive ? (
                        <span style={{ color: colors.primary, fontWeight: 600 }}>On</span>
                      ) : (
                        <span style={{ color: colors.textMuted }}>Off</span>
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
                              {row.isActive ? "Turn off" : "Turn on"}
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
                              Edit
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
                              Archive
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
                          Delete
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
              {pendingDelete ? "Delete promotion?" : "Archive promotion?"}
            </p>
            <p style={{ margin: "0 0 18px", fontSize: "14px", color: colors.textSecondary, lineHeight: 1.5 }}>
              {pendingDelete
                ? "This permanently removes the promotion. Customers will no longer see it."
                : "Archived promotions stay in the list (if “Show archived” is on) but no longer appear on the storefront."}
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
                Cancel
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
                {pendingDelete ? "Delete" : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromotionsPage;
