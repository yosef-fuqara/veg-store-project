import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAdminCategories } from "../services/categoryService";
import { createProduct, getAdminProducts, updateProduct } from "../services/productService";
import { useToast } from "../features/toast/ToastContext";

const UNIT_OPTIONS = ["kg", "gram", "unit", "box"];
const STOCK_OPTIONS = ["in_stock", "out_of_stock"];

const EMPTY_FORM = {
  name: "",
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
};

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

  const title = useMemo(() => (isEditMode ? "Edit Product" : "Add Product"), [isEditMode]);

  const loadInitialData = useCallback(async () => {
    setInitializing(true);
    setError("");
    try {
      const [categoryList, products] = await Promise.all([getAdminCategories(), getAdminProducts()]);
      setCategories(categoryList.filter((cat) => !cat.isDeleted));

      if (isEditMode) {
        const current = products.find((item) => item._id === productId);
        if (!current) throw new Error("Product not found");
        setForm({
          name: current.name || "",
          description: current.description || "",
          price: current.price ?? "",
          salePrice: current.salePrice ?? "",
          category: current.category?._id || "",
          unit: current.unit || "kg",
          stockStatus: current.stockStatus || "in_stock",
          isFeatured: Boolean(current.isFeatured),
          isPreorderOnly: Boolean(current.isPreorderOnly),
          minAdvanceHours: Number.isFinite(current.minAdvanceHours) ? current.minAdvanceHours : 24,
          preparationNotes: current.preparationNotes || "",
        });
        setExistingImageUrl(current.imageUrl || "");
      } else if (categoryList.length) {
        setForm((prev) => ({ ...prev, category: prev.category || categoryList.find((c) => !c.isDeleted)?._id || "" }));
      }
    } catch (err) {
      setError(err.userMessage || err.message || "Failed to load form data");
    } finally {
      setInitializing(false);
    }
  }, [isEditMode, productId]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  const BOOLEAN_FIELDS = new Set(["isFeatured", "isPreorderOnly"]);
  const onChange = (field) => (event) => {
    const value = BOOLEAN_FIELDS.has(field) ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
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
      if (!isEditMode && !imageFile) throw new Error("Product image is required");

      const payload = new FormData();
      payload.append("name", String(form.name).trim());
      payload.append("description", String(form.description).trim());
      payload.append("price", String(form.price));
      payload.append("category", form.category);
      payload.append("unit", form.unit);
      payload.append("stockStatus", form.stockStatus);
      payload.append("isFeatured", String(form.isFeatured));
      payload.append("isPreorderOnly", String(form.isPreorderOnly));
      if (form.isPreorderOnly) {
        payload.append("minAdvanceHours", String(form.minAdvanceHours || 24));
        if (String(form.preparationNotes).trim()) payload.append("preparationNotes", String(form.preparationNotes));
      }
      if (String(form.salePrice).trim() !== "") payload.append("salePrice", String(form.salePrice));
      if (imageFile) payload.append("image", imageFile);

      if (isEditMode) {
        await updateProduct(productId, payload);
        showToast("Product updated successfully.");
      } else {
        await createProduct(payload);
        showToast("Product created successfully.");
      }
      navigate("/products", { replace: true });
    } catch (err) {
      const message = err.userMessage || err.message || "Failed to save product";
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
            {isEditMode ? 'Update the product information below' : 'Fill in the details to add a new product'}
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
          Back
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
            Product Info
          </h3>

          <Field label="Name *">
            <input value={form.name} onChange={onChange("name")} required minLength={2} maxLength={120} onFocus={focus("name")} onBlur={blur} style={inputStyle("name")} />
          </Field>

          <Field label="Description *">
            <textarea value={form.description} onChange={onChange("description")} required minLength={2} maxLength={2000} rows={4} onFocus={focus("description")} onBlur={blur} style={{ ...inputStyle("description"), resize: 'vertical', minHeight: '96px' }} />
          </Field>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
          }}>
            <Field label="Price (₪) *">
              <input type="number" min="0" step="0.01" value={form.price} onChange={onChange("price")} required onFocus={focus("price")} onBlur={blur} style={inputStyle("price")} />
            </Field>
            <Field label="Sale Price (₪)" hint="Optional — leave empty for no sale">
              <input type="number" min="0" step="0.01" value={form.salePrice} onChange={onChange("salePrice")} onFocus={focus("salePrice")} onBlur={blur} style={inputStyle("salePrice")} />
            </Field>
          </div>
        </div>

        {/* Category, unit, stock card */}
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Classification
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
          }}>
            <Field label="Category *">
              <select value={form.category} onChange={onChange("category")} required onFocus={focus("category")} onBlur={blur} style={{ ...inputStyle("category"), cursor: 'pointer' }}>
                <option value="" disabled>Select</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Unit *">
              <select value={form.unit} onChange={onChange("unit")} required onFocus={focus("unit")} onBlur={blur} style={{ ...inputStyle("unit"), cursor: 'pointer' }}>
                {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>

            <Field label="Stock Status *">
              <select value={form.stockStatus} onChange={onChange("stockStatus")} required onFocus={focus("stockStatus")} onBlur={blur} style={{ ...inputStyle("stockStatus"), cursor: 'pointer' }}>
                {STOCK_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </Field>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '14px', color: colors.textPrimary, fontWeight: 500, userSelect: 'none' }}>
            <input type="checkbox" checked={form.isFeatured} onChange={onChange("isFeatured")} style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: colors.primary, cursor: 'pointer', flexShrink: 0 }} />
            <span>
              Featured product
              <span style={{ display: 'block', fontSize: '12px', color: colors.textMuted, fontWeight: 400, marginTop: '4px' }}>Shown prominently on storefront</span>
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
              Preorder / Custom Platter
            </h3>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '14px', color: colors.warning, fontWeight: 500, userSelect: 'none' }}>
            <input type="checkbox" checked={form.isPreorderOnly} onChange={onChange("isPreorderOnly")} style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: colors.warning, cursor: 'pointer', flexShrink: 0 }} />
            <span>Preorder only (requires advance notice)</span>
          </label>

          {form.isPreorderOnly && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Field label="Minimum advance notice (hours) *">
                <input type="number" min="1" max="720" step="1" value={form.minAdvanceHours} onChange={onChange("minAdvanceHours")} required onFocus={focus("minAdvHours")} onBlur={blur} style={{ ...inputStyle("minAdvHours"), background: '#fffdf5', borderColor: focused === 'minAdvHours' ? colors.primary : colors.warningBorder }} />
              </Field>
              <Field label="Preparation notes (internal)" hint="Not shown to customers">
                <textarea value={form.preparationNotes} onChange={onChange("preparationNotes")} maxLength={1000} rows={3} onFocus={focus("prepNotes")} onBlur={blur} style={{ ...inputStyle("prepNotes"), background: '#fffdf5', borderColor: focused === 'prepNotes' ? colors.primary : colors.warningBorder, resize: 'vertical', minHeight: '80px' }} />
              </Field>
            </div>
          )}
        </div>

        {/* Image card */}
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Product Image {isEditMode ? '(optional)' : '(required)'}
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
                  alt="Product preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ flex: '1 1 180px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
                    {imagePreview ? 'New image selected' : 'Current image'}
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
                      Pending upload
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {imageFile ? imageFile.name : (isEditMode ? 'Replace by choosing a file below.' : 'This image will appear on the storefront.')}
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
                      {isEditMode ? 'Discard new image' : 'Remove'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={labelStyle}>
            <span>{isEditMode ? 'Upload a new image to replace the current one' : 'Select image'}</span>
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
                {imageFile ? imageFile.name : 'Click or drop an image here'}
              </div>
              <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '6px' }}>
                PNG, JPG, WebP — max size per server limits
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
                aria-label={isEditMode ? 'Upload replacement product image' : 'Select product image'}
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
            {submitting ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Product'}
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
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
