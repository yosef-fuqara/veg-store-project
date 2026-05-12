import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getAdminCategories } from "../services/categoryService";
import { getLocalizedText, pickLocalizedName } from "../utils/localizedDisplayName";
import { createProduct, getAdminProducts, updateProduct } from "../services/productService";
import { useToast } from "../features/toast/ToastContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

const UNIT_OPTIONS = ["kg", "gram", "unit", "box"];
const STOCK_OPTIONS = ["in_stock", "out_of_stock"];

const emptyName = () => ({ ar: "", he: "", en: "" });

const parseNameFromProduct = (raw) => {
  if (raw == null) return emptyName();
  if (typeof raw === "string") return { ar: raw, he: raw, en: raw };
  return {
    ar: typeof raw.ar === "string" ? raw.ar : "",
    he: typeof raw.he === "string" ? raw.he : "",
    en: typeof raw.en === "string" ? raw.en : ""
  };
};

/** Single textarea: coerce API string or { ar, he, en } to a string. */
const parseDescriptionForForm = (raw) => {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return getLocalizedText(raw, "en");
  }
  return "";
};

const EMPTY_FORM = {
  name: emptyName(),
  description: "",
  price: "",
  salePrice: "",
  category: "",
  unit: "kg",
  stockStatus: "in_stock",
  isFeatured: false,
  isPreorderOnly: false,
  minAdvanceHours: 24,
  preparationNotes: "",
  allowPurchaseByAmount: false,
};

const VEGSTORE_ADMIN_PRODUCT_DRAFT_KEY = "vegstore_admin_product_draft";

const colors = {
  primary:      '#1e6b3c',
  primaryHover: '#165430',
  bg:           '#faf8f5',
  surface:      '#ffffff',
  border:       '#e8e3dc',
  borderLight:  '#f0ece6',
  textPrimary:  '#1c1917',
  textSecondary:'#57534e',
  textMuted:    '#a8a29e',
  textInverse:  '#ffffff',
  error:        '#991b1b',
  errorBg:      '#fef2f2',
  errorBorder:  '#fecaca',
  warning:      '#92400e',
  warningBg:    '#fffbeb',
  warningBorder:'#fde68a',
};

const fontStack = "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  minWidth: 0,
  padding: '10px 14px',
  borderRadius: '10px',
  border: `1.5px solid ${colors.border}`,
  fontSize: '15px',
  lineHeight: 1.45,
  color: colors.textPrimary,
  background: colors.surface,
  outline: 'none',
  fontFamily: fontStack,
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '14px',
  fontWeight: 500,
  color: colors.textSecondary,
};

const cardStyle = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: '14px',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const Field = ({ label, hint, children }) => (
  <div style={labelStyle}>
    <span>{label}</span>
    {children}
    {hint && <span style={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.5 }}>{hint}</span>}
  </div>
);

const ProductFormPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation(["products", "common"]);
  const productId = params.id;
  const isEditMode = Boolean(productId);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [categories, setCategories] = useState([]);
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(null);
  const [dropFocused, setDropFocused] = useState(false);

  const [, setStoredAdminDraft] = useLocalStorage(VEGSTORE_ADMIN_PRODUCT_DRAFT_KEY, null);
  const draftScopeAppliedRef = useRef("");

  const title = useMemo(
    () => (isEditMode ? t("products:form.titleEdit") : t("products:form.titleNew")),
    [isEditMode, t]
  );

  const loadInitialData = useCallback(async () => {
    setInitializing(true);
    setError("");
    try {
      const [categoryList, products] = await Promise.all([getAdminCategories(), getAdminProducts()]);
      setCategories(categoryList.filter((cat) => !cat.isDeleted));

      if (isEditMode) {
        const current = products.find((item) => item._id === productId);
        if (!current) throw new Error(t("products:form.errors.productNotFound"));
        setForm({
          name: parseNameFromProduct(current.name),
          description: parseDescriptionForForm(current.description),
          price: current.price ?? "",
          salePrice: current.salePrice ?? "",
          category: current.category?._id || "",
          unit: current.unit || "kg",
          stockStatus: current.stockStatus || "in_stock",
          isFeatured: Boolean(current.isFeatured),
          isPreorderOnly: Boolean(current.isPreorderOnly),
          minAdvanceHours: Number.isFinite(current.minAdvanceHours) ? current.minAdvanceHours : 24,
          preparationNotes: current.preparationNotes || "",
          allowPurchaseByAmount: Boolean(current.allowPurchaseByAmount),
        });
        setExistingImageUrl(current.imageUrl || "");
      } else if (categoryList.length) {
        setForm((prev) => ({ ...prev, category: prev.category || categoryList.find((c) => !c.isDeleted)?._id || "" }));
      }
    } catch (err) {
      setError(err.userMessage || err.message || t("products:form.errors.loadFailed"));
    } finally {
      setInitializing(false);
    }
  }, [isEditMode, productId, t]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  useEffect(() => {
    draftScopeAppliedRef.current = "";
  }, [productId, isEditMode]);

  useLayoutEffect(() => {
    if (initializing) return;
    const scope = isEditMode ? `edit:${productId}` : "new";
    if (draftScopeAppliedRef.current === scope) return;
    draftScopeAppliedRef.current = scope;
    try {
      const raw = window.localStorage.getItem(VEGSTORE_ADMIN_PRODUCT_DRAFT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || data.v !== 1 || !data.form || typeof data.form !== "object") return;
      if (isEditMode) {
        if (data.mode !== "edit" || data.productId !== productId) return;
      } else if (data.mode !== "new") return;
      setForm((prev) => {
        const d = data.form.description;
        const description =
          typeof d === "string" ? d : getLocalizedText(d, "en");
        return {
          ...prev,
          ...data.form,
          name: { ...prev.name, ...(data.form.name || {}) },
          description
        };
      });
    } catch {
      /* ignore */
    }
  }, [initializing, isEditMode, productId]);

  useEffect(() => {
    if (initializing) return;
    const id = window.setTimeout(() => {
      setStoredAdminDraft({
        v: 1,
        mode: isEditMode ? "edit" : "new",
        productId: isEditMode ? productId : null,
        form
      });
    }, 400);
    return () => window.clearTimeout(id);
  }, [form, initializing, isEditMode, productId, setStoredAdminDraft]);

  const BOOLEAN_FIELDS = new Set(["isFeatured", "isPreorderOnly", "allowPurchaseByAmount"]);
  const onChange = (field) => (event) => {
    const value = BOOLEAN_FIELDS.has(field) ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onNameChange = (locale) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, name: { ...prev.name, [locale]: value } }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (!isEditMode && !imageFile) throw new Error(t("products:form.errors.imageRequired"));

      const payload = new FormData();
      payload.append(
        "name",
        JSON.stringify({
          ar: String(form.name.ar).trim(),
          he: String(form.name.he).trim(),
          en: String(form.name.en).trim()
        })
      );
      payload.append("description", String(form.description).trim());
      payload.append("price", String(form.price));
      payload.append("category", form.category);
      payload.append("unit", form.unit);
      payload.append("stockStatus", form.stockStatus);
      payload.append("isFeatured", String(form.isFeatured));
      payload.append("isPreorderOnly", String(form.isPreorderOnly));
      payload.append("allowPurchaseByAmount", String(form.allowPurchaseByAmount));
      if (form.isPreorderOnly) {
        payload.append("minAdvanceHours", String(form.minAdvanceHours || 24));
        if (String(form.preparationNotes).trim()) payload.append("preparationNotes", String(form.preparationNotes));
      }
      if (String(form.salePrice).trim() !== "") payload.append("salePrice", String(form.salePrice));
      if (imageFile) payload.append("image", imageFile);

      if (isEditMode) {
        await updateProduct(productId, payload);
        showToast(t("products:form.toasts.updated"));
      } else {
        await createProduct(payload);
        showToast(t("products:form.toasts.created"));
      }
      setStoredAdminDraft(null);
      navigate("/products", { replace: true });
    } catch (err) {
      const message = err.userMessage || err.message || t("products:form.errors.saveFailed");
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field) => ({
    ...inputBase,
    ...(focused === field ? { borderColor: colors.primary, boxShadow: '0 0 0 3px rgba(30,107,60,0.12)' } : {}),
  });

  const focus = (f) => () => setFocused(f);
  const blur = () => setFocused(null);

  if (initializing) {
    return (
      <div style={{ maxWidth: '720px', width: '100%', boxSizing: 'border-box', minWidth: 0, fontFamily: fontStack }}>
        <style>{`
          @keyframes adminFormSkeletonPulse {
            0%, 100% { opacity: 0.42; }
            50% { opacity: 0.78; }
          }
          .admin-form-skel { animation: adminFormSkeletonPulse 1.35s ease-in-out infinite; }
        `}</style>
        <div className="admin-form-skel" style={{ height: '28px', width: '55%', maxWidth: '280px', background: colors.borderLight, borderRadius: '10px', marginBottom: '12px' }} />
        <div className="admin-form-skel" style={{ height: '16px', width: '72%', maxWidth: '360px', background: colors.borderLight, borderRadius: '8px', marginBottom: '32px' }} />
        <div style={{ ...cardStyle, padding: '24px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="admin-form-skel" style={{ height: '48px', background: colors.borderLight, borderRadius: '10px' }} />
          ))}
        </div>
      </div>
    );
  }

  const previewSrc = imagePreview || existingImageUrl;
  const dropBorder = dropFocused ? colors.primary : colors.border;
  const dropBg = dropFocused ? '#eef7f1' : colors.bg;

  return (
    <div style={{ maxWidth: '720px', width: '100%', boxSizing: 'border-box', minWidth: 0, fontFamily: fontStack }}>
      <style>{`
        @keyframes adminFormSpin {
          to { transform: rotate(360deg); }
        }
        .product-form-back:focus-visible,
        .product-form-submit:focus-visible,
        .product-form-cancel:focus-visible,
        .product-form-image-remove:focus-visible {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }
        .product-form-spinner {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          animation: adminFormSpin 0.9s linear infinite;
          display: inline-block;
        }
      `}</style>

      {/* Page header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.3px' }}>
            {title}
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: colors.textMuted, lineHeight: 1.5 }}>
            {isEditMode ? t('products:form.subtitleEdit') : t('products:form.subtitleNew')}
          </p>
        </div>
        <Link
          to="/products"
          className="product-form-back"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: `1px solid ${colors.border}`,
            background: colors.surface,
            color: colors.textPrimary,
            fontSize: '14px',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'background 0.15s, border-color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = colors.bg; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {t('common:back')}
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Basic info card */}
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('products:form.sections.info')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>{t('products:form.fields.nameAllLangs')}</span>
            <Field label={t('products:form.fields.nameAr')}>
              <input value={form.name.ar} onChange={onNameChange("ar")} required minLength={2} maxLength={120} onFocus={focus("nameAr")} onBlur={blur} style={inputStyle("nameAr")} dir="rtl" />
            </Field>
            <Field label={t('products:form.fields.nameHe')}>
              <input value={form.name.he} onChange={onNameChange("he")} required minLength={2} maxLength={120} onFocus={focus("nameHe")} onBlur={blur} style={inputStyle("nameHe")} dir="rtl" />
            </Field>
            <Field label={t('products:form.fields.nameEn')}>
              <input value={form.name.en} onChange={onNameChange("en")} required minLength={2} maxLength={120} onFocus={focus("nameEn")} onBlur={blur} style={inputStyle("nameEn")} dir="ltr" />
            </Field>
          </div>

          <Field label={t('products:form.fields.description')} hint={t('products:form.fields.descriptionHint')}>
            <textarea value={form.description} onChange={onChange("description")} maxLength={2000} rows={4} onFocus={focus("description")} onBlur={blur} style={{ ...inputStyle("description"), resize: 'vertical', minHeight: '96px' }} />
          </Field>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
          }}>
            <Field label={t('products:form.fields.price')}>
              <input type="number" min="0" step="0.01" value={form.price} onChange={onChange("price")} required onFocus={focus("price")} onBlur={blur} style={inputStyle("price")} />
            </Field>
            <Field label={t('products:form.fields.salePrice')} hint={t('products:form.fields.salePriceHint')}>
              <input type="number" min="0" step="0.01" value={form.salePrice} onChange={onChange("salePrice")} onFocus={focus("salePrice")} onBlur={blur} style={inputStyle("salePrice")} />
            </Field>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '14px', color: colors.textPrimary, fontWeight: 500, userSelect: 'none' }}>
            <input type="checkbox" checked={form.allowPurchaseByAmount} onChange={onChange("allowPurchaseByAmount")} style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: colors.primary, cursor: 'pointer', flexShrink: 0 }} />
            <span>
              {t('products:form.fields.allowByAmount')}
              <span style={{ display: 'block', fontSize: '12px', color: colors.textMuted, fontWeight: 400, marginTop: '4px' }}>
                {t('products:form.fields.allowByAmountHint')}
              </span>
            </span>
          </label>
        </div>

        {/* Category, unit, stock card */}
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('products:form.sections.classification')}
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
          }}>
            <Field label={t('products:form.fields.category')}>
              <select value={form.category} onChange={onChange("category")} required onFocus={focus("category")} onBlur={blur} style={{ ...inputStyle("category"), cursor: 'pointer' }}>
                <option value="" disabled>{t('common:selectPlaceholder')}</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{pickLocalizedName(cat.name)}</option>
                ))}
              </select>
            </Field>

            <Field label={t('products:form.fields.unit')}>
              <select value={form.unit} onChange={onChange("unit")} required onFocus={focus("unit")} onBlur={blur} style={{ ...inputStyle("unit"), cursor: 'pointer' }}>
                {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>

            <Field label={t('products:form.fields.stockStatus')}>
              <select value={form.stockStatus} onChange={onChange("stockStatus")} required onFocus={focus("stockStatus")} onBlur={blur} style={{ ...inputStyle("stockStatus"), cursor: 'pointer' }}>
                {STOCK_OPTIONS.map((s) => <option key={s} value={s}>{t(`products:form.stockOptions.${s}`)}</option>)}
              </select>
            </Field>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '14px', color: colors.textPrimary, fontWeight: 500, userSelect: 'none' }}>
            <input type="checkbox" checked={form.isFeatured} onChange={onChange("isFeatured")} style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: colors.primary, cursor: 'pointer', flexShrink: 0 }} />
            <span>
              {t('products:form.fields.featured')}
              <span style={{ display: 'block', fontSize: '12px', color: colors.textMuted, fontWeight: 400, marginTop: '4px' }}>{t('products:form.fields.featuredHint')}</span>
            </span>
          </label>
        </div>

        {/* Preorder card */}
        <div style={{ background: colors.warningBg, border: `1px solid ${colors.warningBorder}`, borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.warning, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('products:form.sections.preorder')}
            </h3>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '14px', color: colors.warning, fontWeight: 500, userSelect: 'none' }}>
            <input type="checkbox" checked={form.isPreorderOnly} onChange={onChange("isPreorderOnly")} style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: colors.warning, cursor: 'pointer', flexShrink: 0 }} />
            <span>{t('products:form.fields.preorderOnly')}</span>
          </label>

          {form.isPreorderOnly && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label={t('products:form.fields.minAdvance')}>
                <input type="number" min="1" max="720" step="1" value={form.minAdvanceHours} onChange={onChange("minAdvanceHours")} required onFocus={focus("minAdvHours")} onBlur={blur} style={{ ...inputStyle("minAdvHours"), background: '#fffdf5', borderColor: focused === 'minAdvHours' ? colors.primary : colors.warningBorder }} />
              </Field>
              <Field label={t('products:form.fields.preparationNotes')} hint={t('products:form.fields.preparationNotesHint')}>
                <textarea value={form.preparationNotes} onChange={onChange("preparationNotes")} maxLength={1000} rows={3} onFocus={focus("prepNotes")} onBlur={blur} style={{ ...inputStyle("prepNotes"), background: '#fffdf5', borderColor: focused === 'prepNotes' ? colors.primary : colors.warningBorder, resize: 'vertical', minHeight: '80px' }} />
              </Field>
            </div>
          )}
        </div>

        {/* Image card */}
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isEditMode ? t('products:form.sections.imageOptional') : t('products:form.sections.imageRequired')}
          </h3>

          {previewSrc && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              background: colors.bg,
            }}>
              <div style={{
                flexShrink: 0,
                width: '112px',
                aspectRatio: '1',
                borderRadius: '12px',
                overflow: 'hidden',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                background: colors.surface,
              }}>
                <img
                  src={previewSrc}
                  alt={t('products:form.image.previewAlt')}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ flex: '1 1 180px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
                    {imagePreview ? t('products:form.image.newSelected') : t('products:form.image.current')}
                  </span>
                  {imagePreview && (
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: '#dcfce7',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}>
                      {t('products:form.image.pendingUpload')}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {imageFile ? imageFile.name : (isEditMode ? t('products:form.image.currentReplaceHint') : t('products:form.image.newAppearsOnStorefront'))}
                </div>
                {imagePreview && (
                  <div>
                    <button
                      type="button"
                      className="product-form-image-remove"
                      onClick={() => { setImageFile(null); setImagePreview(""); }}
                      disabled={submitting}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`,
                        background: colors.surface,
                        color: colors.textSecondary,
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        fontFamily: fontStack,
                        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                      }}
                      onMouseEnter={(e) => { if (!submitting) { e.currentTarget.style.borderColor = colors.error; e.currentTarget.style.color = colors.error; } }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textSecondary; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      {isEditMode ? t('products:form.image.discardNewImage') : t('common:remove')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={labelStyle}>
            <span>{isEditMode ? t('products:form.image.uploadReplace') : t('products:form.image.selectImage')}</span>
            <div
              style={{
                position: 'relative',
                marginTop: '6px',
                padding: '32px 20px',
                borderRadius: '12px',
                border: `2px dashed ${dropBorder}`,
                background: dropBg,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                boxShadow: dropFocused ? '0 0 0 3px rgba(30,107,60,0.10)' : 'none',
              }}
              onDragEnter={(e) => { e.preventDefault(); setDropFocused(true); }}
              onDragOver={(e) => { e.preventDefault(); setDropFocused(true); }}
              onDragLeave={() => setDropFocused(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDropFocused(false);
                const file = e.dataTransfer?.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  setImageFile(file);
                  const reader = new FileReader();
                  reader.onload = (ev) => setImagePreview(ev.target.result);
                  reader.readAsDataURL(file);
                }
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', display: 'block' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <div style={{ fontSize: '14px', color: colors.textSecondary, fontWeight: 500 }}>
                {imageFile ? imageFile.name : t('products:form.image.clickOrDrop')}
              </div>
              <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '6px' }}>
                {t('products:form.image.fileTypes')}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required={!isEditMode}
                onFocus={() => setDropFocused(true)}
                onBlur={() => setDropFocused(false)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
                aria-label={isEditMode ? t('products:form.image.uploadReplacementAria') : t('products:form.image.selectImageAria')}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="submit"
            className="product-form-submit"
            disabled={submitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              flex: '1 1 200px',
              minWidth: 0,
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              background: submitting ? colors.border : colors.primary,
              color: submitting ? colors.textMuted : colors.textInverse,
              fontSize: '15px',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 4px 14px rgba(30,107,60,0.28)',
              fontFamily: fontStack,
              transition: 'background 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = colors.primaryHover; }}
            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = colors.primary; }}
          >
            {submitting && (
              <svg className="product-form-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
              </svg>
            )}
            {submitting
              ? t('products:form.buttons.saving')
              : isEditMode
                ? t('products:form.buttons.submitEdit')
                : t('products:form.buttons.submitNew')}
          </button>
          <button
            type="button"
            className="product-form-cancel"
            onClick={() => navigate("/products")}
            disabled={submitting}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.textPrimary,
              fontSize: '15px',
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: fontStack,
              transition: 'background 0.15s, border-color 0.15s',
              flex: '0 1 auto',
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = colors.bg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
          >
            {t('products:form.buttons.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
