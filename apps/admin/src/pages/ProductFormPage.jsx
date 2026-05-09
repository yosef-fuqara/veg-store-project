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

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 13px',
  borderRadius: '9px',
  border: `1.5px solid ${colors.border}`,
  fontSize: '14px',
  color: colors.textPrimary,
  background: colors.surface,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  fontSize: '13px',
  fontWeight: 500,
  color: colors.textSecondary,
};

const Field = ({ label, hint, children }) => (
  <div style={labelStyle}>
    <span>{label}</span>
    {children}
    {hint && <span style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px' }}>{hint}</span>}
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
    ...(focused === field ? { borderColor: colors.primary, boxShadow: '0 0 0 3px rgba(30,107,60,0.10)' } : {}),
  });

  const focus = (f) => () => setFocused(f);
  const blur = () => setFocused(null);

  if (initializing) {
    return (
      <div>
        <div style={{ height: '36px', width: '200px', background: colors.border, borderRadius: '8px', marginBottom: '24px', animation: 'pulse 1.5s ease infinite' }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: '44px', background: colors.border, borderRadius: '9px', marginBottom: '12px' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.3px' }}>
            {title}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textMuted }}>
            {isEditMode ? 'Update the product information below' : 'Fill in the details to add a new product'}
          </p>
        </div>
        <Link
          to="/products"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '8px 14px', borderRadius: '8px',
            border: `1px solid ${colors.border}`, background: colors.surface,
            color: colors.textPrimary, fontSize: '13px', fontWeight: 500, textDecoration: 'none',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Basic info card */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Product Info
          </h3>

          <Field label="Name *">
            <input value={form.name} onChange={onChange("name")} required minLength={2} maxLength={120} onFocus={focus("name")} onBlur={blur} style={inputStyle("name")} />
          </Field>

          <Field label="Description *">
            <textarea value={form.description} onChange={onChange("description")} required minLength={2} maxLength={2000} rows={4} onFocus={focus("description")} onBlur={blur} style={{ ...inputStyle("description"), resize: 'vertical', fontFamily: 'inherit' }} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Price (₪) *">
              <input type="number" min="0" step="0.01" value={form.price} onChange={onChange("price")} required onFocus={focus("price")} onBlur={blur} style={inputStyle("price")} />
            </Field>
            <Field label="Sale Price (₪)" hint="Optional — leave empty for no sale">
              <input type="number" min="0" step="0.01" value={form.salePrice} onChange={onChange("salePrice")} onFocus={focus("salePrice")} onBlur={blur} style={inputStyle("salePrice")} />
            </Field>
          </div>
        </div>

        {/* Category, unit, stock card */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Classification
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
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

          <label style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', fontSize: '14px', color: colors.textPrimary, fontWeight: 500, userSelect: 'none' }}>
            <input type="checkbox" checked={form.isFeatured} onChange={onChange("isFeatured")} style={{ width: '16px', height: '16px', accentColor: colors.primary, cursor: 'pointer' }} />
            Featured product
            <span style={{ fontSize: '12px', color: colors.textMuted, fontWeight: 400 }}>(shown prominently on storefront)</span>
          </label>
        </div>

        {/* Preorder card */}
        <div style={{ background: colors.warningBg, border: `1px solid ${colors.warningBorder}`, borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.warning, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Preorder / Custom Platter
            </h3>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', fontSize: '14px', color: colors.warning, fontWeight: 500, userSelect: 'none' }}>
            <input type="checkbox" checked={form.isPreorderOnly} onChange={onChange("isPreorderOnly")} style={{ width: '16px', height: '16px', accentColor: colors.warning, cursor: 'pointer' }} />
            Preorder only (requires advance notice)
          </label>

          {form.isPreorderOnly && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Field label="Minimum advance notice (hours) *">
                <input type="number" min="1" max="720" step="1" value={form.minAdvanceHours} onChange={onChange("minAdvanceHours")} required onFocus={focus("minAdvHours")} onBlur={blur} style={{ ...inputStyle("minAdvHours"), background: '#fffdf5', borderColor: colors.warningBorder }} />
              </Field>
              <Field label="Preparation notes (internal)" hint="Not shown to customers">
                <textarea value={form.preparationNotes} onChange={onChange("preparationNotes")} maxLength={1000} rows={3} onFocus={focus("prepNotes")} onBlur={blur} style={{ ...inputStyle("prepNotes"), background: '#fffdf5', borderColor: colors.warningBorder, resize: 'vertical', fontFamily: 'inherit' }} />
              </Field>
            </div>
          )}
        </div>

        {/* Image card */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Product Image {isEditMode ? '(optional)' : '(required)'}
          </h3>

          {(imagePreview || existingImageUrl) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img
                src={imagePreview || existingImageUrl}
                alt="Product preview"
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: `1px solid ${colors.border}` }}
              />
              <span style={{ fontSize: '13px', color: colors.textMuted }}>
                {imagePreview ? 'New image selected' : 'Current image'}
              </span>
            </div>
          )}

          <label style={{ ...labelStyle, cursor: 'pointer' }}>
            {isEditMode ? 'Upload a new image to replace the current one' : 'Select image'}
            <div style={{
              marginTop: '4px',
              padding: '28px 20px',
              borderRadius: '10px',
              border: `2px dashed ${colors.border}`,
              background: colors.bg,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 6px', display: 'block' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <div style={{ fontSize: '13px', color: colors.textMuted }}>
                {imageFile ? imageFile.name : 'Click to select an image'}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required={!isEditMode}
                style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, opacity: 0, cursor: 'pointer' }}
              />
            </div>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: 1,
              padding: '11px 20px',
              borderRadius: '10px',
              border: 'none',
              background: submitting ? colors.border : colors.primary,
              color: submitting ? colors.textMuted : colors.textInverse,
              fontSize: '15px',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 4px 14px rgba(30,107,60,0.28)',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate("/products")}
            disabled={submitting}
            style={{
              padding: '11px 20px',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.textPrimary,
              fontSize: '15px',
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
