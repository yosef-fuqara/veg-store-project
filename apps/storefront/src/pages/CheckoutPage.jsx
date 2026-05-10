import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ALLOWED_DELIVERY_AREAS as FALLBACK_AREAS,
  LOCAL_DELIVERY_AREA as FALLBACK_LOCAL_AREA,
  LOCAL_FREE_DELIVERY_MIN,
  LOCAL_DELIVERY_FEE,
  OUTSIDE_FREE_DELIVERY_MIN,
  OUTSIDE_DELIVERY_FEE,
  PAYMENT_METHODS,
  estimateDeliveryFee
} from "../config/delivery";
import { useCart } from "../features/cart/CartContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import * as cartService from "../services/cartService";
import * as orderService from "../services/orderService";
import { formatPrice } from "../utils/formatPrice";
import { deliveryAreaOptionLabel } from "../utils/deliveryAreaDisplay";
import { getLocalizedProductName } from "../utils/localizedProduct";
import {
  clearOrderSuccessStorage,
  loadCheckoutDraft,
  VEGSTORE_CHECKOUT_DRAFT_KEY
} from "../utils/vegstorePersistence";

const colors = {
  primary:        '#1e6b3c',
  primarySurface: '#eef7f1',
  primaryBorder:  '#a3cfb4',
  surface:        '#ffffff',
  surfaceRaised:  '#f5f2ed',
  border:         '#e8e3dc',
  textPrimary:    '#1c1917',
  textSecondary:  '#57534e',
  textMuted:      '#a8a29e',
  textInverse:    '#ffffff',
  success:        '#166534',
  successSurface: '#f0fdf4',
  successBorder:  '#bbf7d0',
  error:          '#991b1b',
  errorSurface:   '#fef2f2',
  errorBorder:    '#fecaca',
  warning:        '#92400e',
  warningSurface: '#fffbeb',
  warningBorder:  '#fde68a',
};

const pageStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '40px 24px',
};

const useIsNarrowCheckout = () => {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 900
  );
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 900);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return narrow;
};

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  borderRadius: '10px',
  border: `1.5px solid #e8e3dc`,
  fontSize: '15px',
  color: '#1c1917',
  background: '#ffffff',
  outline: 'none',
  display: 'block',
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

const sectionStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: '10px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 600,
  color: colors.textPrimary,
};

const initialForm = {
  deliveryAddress: { street: "", building: "", apartment: "", notes: "" },
  deliveryArea: "",
  customerPhone: "",
  notes: "",
  paymentMethod: PAYMENT_METHODS[0].value,
  preferredDeliveryAt: "",
  customRequest: ""
};

const mergeCheckoutDraft = (draft) => {
  if (!draft || typeof draft !== "object") return initialForm;
  const addr =
    draft.deliveryAddress && typeof draft.deliveryAddress === "object"
      ? draft.deliveryAddress
      : {};
  return {
    ...initialForm,
    deliveryAddress: {
      street: typeof addr.street === "string" ? addr.street : initialForm.deliveryAddress.street,
      building: typeof addr.building === "string" ? addr.building : initialForm.deliveryAddress.building,
      apartment: typeof addr.apartment === "string" ? addr.apartment : initialForm.deliveryAddress.apartment,
      notes: typeof addr.notes === "string" ? addr.notes : initialForm.deliveryAddress.notes
    },
    deliveryArea: typeof draft.deliveryArea === "string" ? draft.deliveryArea : initialForm.deliveryArea,
    customerPhone:
      typeof draft.customerPhone === "string" ? draft.customerPhone : initialForm.customerPhone,
    notes: typeof draft.notes === "string" ? draft.notes : initialForm.notes,
    paymentMethod: initialForm.paymentMethod,
    preferredDeliveryAt:
      typeof draft.preferredDeliveryAt === "string"
        ? draft.preferredDeliveryAt
        : initialForm.preferredDeliveryAt,
    customRequest:
      typeof draft.customRequest === "string" ? draft.customRequest : initialForm.customRequest
  };
};

const fieldErrorsFromResponse = (err) => {
  const fields = err.response?.data?.details?.fields;
  if (!Array.isArray(fields)) return {};
  return fields.reduce((acc, item) => {
    const key = Array.isArray(item.path) ? item.path.join(".") : item.path;
    if (key && !acc[key]) acc[key] = item.message;
    return acc;
  }, {});
};

/** Visual / logical order of fields for “first error” scroll (matches form layout). */
const CHECKOUT_FIELD_SCROLL_ORDER = [
  "deliveryAddress.street",
  "deliveryAddress.building",
  "deliveryAddress.apartment",
  "deliveryAddress.notes",
  "deliveryArea",
  "preferredDeliveryAt",
  "customRequest",
  "customerPhone",
  "notes",
  "paymentMethod",
];

const getFirstFieldErrorKey = (errors) => {
  if (!errors || typeof errors !== "object") return null;
  for (const key of CHECKOUT_FIELD_SCROLL_ORDER) {
    if (errors[key]) return key;
  }
  const keys = Object.keys(errors);
  return keys.length ? keys[0] : null;
};

const minDateTimeLocal = (hoursAhead) => {
  const target = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
};

const Skeleton = ({ height = 44, width = '100%' }) => (
  <motion.div
    animate={{ opacity: [0.4, 0.8, 0.4] }}
    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
    style={{ width, height, background: colors.border, borderRadius: '6px' }}
  />
);

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshCart } = useCart();
  const [, setCheckoutDraft] = useLocalStorage(VEGSTORE_CHECKOUT_DRAFT_KEY, null);
  const { t, i18n } = useTranslation("checkout");
  const lang = (i18n.language || "he").split("-")[0];
  const isNarrow = useIsNarrowCheckout();

  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);

  const [areas, setAreas] = useState(FALLBACK_AREAS);
  const [localAreaKey, setLocalAreaKey] = useState(FALLBACK_LOCAL_AREA);
  const [rules, setRules] = useState({
    localFreeDeliveryMin: LOCAL_FREE_DELIVERY_MIN,
    outsideFreeDeliveryMin: OUTSIDE_FREE_DELIVERY_MIN,
    localDeliveryFee: LOCAL_DELIVERY_FEE,
    outsideDeliveryFee: OUTSIDE_DELIVERY_FEE
  });

  const [form, setForm] = useState(() =>
    mergeCheckoutDraft(typeof window !== "undefined" ? loadCheckoutDraft() : null)
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const fieldElRefs = useRef({});
  const assignFieldRef = (key) => (el) => {
    fieldElRefs.current[key] = el;
  };
  const pendingScrollToFirstErrorRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPreviewLoading(true);
      setPreviewError("");
      try {
        const [checkout, deliveryInfo] = await Promise.all([
          cartService.prepareCheckout(),
          orderService.getDeliveryAreas().catch(() => null)
        ]);
        if (cancelled) return;
        setPreview(checkout);
        if (deliveryInfo?.areas?.length) setAreas(deliveryInfo.areas);
        if (deliveryInfo?.localAreaKey) setLocalAreaKey(deliveryInfo.localAreaKey);
        if (deliveryInfo?.rules) setRules(deliveryInfo.rules);
      } catch (err) {
        if (cancelled) return;
        setPreview(null);
        setPreviewError(err.userMessage || t("previewLoadError"));
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [t]);

  useEffect(() => {
    setForm((prev) => {
      const allowed = new Set(areas.map((a) => a.key));
      if (!prev.deliveryArea || allowed.has(prev.deliveryArea)) return prev;
      return { ...prev, deliveryArea: "" };
    });
  }, [areas]);

  const checkoutDraftSlice = useMemo(
    () => ({
      v: 1,
      deliveryAddress: form.deliveryAddress,
      deliveryArea: form.deliveryArea,
      customerPhone: form.customerPhone,
      notes: form.notes,
      preferredDeliveryAt: form.preferredDeliveryAt,
      customRequest: form.customRequest
    }),
    [
      form.deliveryAddress,
      form.deliveryArea,
      form.customerPhone,
      form.notes,
      form.preferredDeliveryAt,
      form.customRequest
    ]
  );

  useEffect(() => {
    const id = window.setTimeout(() => setCheckoutDraft(checkoutDraftSlice), 320);
    return () => window.clearTimeout(id);
  }, [checkoutDraftSlice, setCheckoutDraft]);

  const scrollToDelivery = Boolean(location.state?.scrollToDelivery);
  useLayoutEffect(() => {
    if (previewLoading || previewError) return;
    if (!preview?.items?.length) return;
    if (!scrollToDelivery) return;
    const el = document.getElementById("checkout-delivery");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: {} });
  }, [
    previewLoading,
    previewError,
    preview?.items?.length,
    scrollToDelivery,
    location.pathname,
    location.search,
    navigate,
  ]);

  useEffect(() => {
    if (!pendingScrollToFirstErrorRef.current) return;
    const firstKey = getFirstFieldErrorKey(fieldErrors);
    if (!firstKey) {
      pendingScrollToFirstErrorRef.current = false;
      return;
    }
    pendingScrollToFirstErrorRef.current = false;
    const el = fieldElRefs.current[firstKey];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      if (firstKey === "paymentMethod") {
        el.querySelector?.('input[type="radio"]')?.focus?.({ preventScroll: true });
      } else if (typeof el.focus === "function") {
        el.focus({ preventScroll: true });
      }
    }, 480);
  }, [fieldErrors]);

  const subtotal = preview?.subtotal ?? 0;
  const wrapTotal = Number(preview?.wrapTotal) || 0;
  const hasPreorderItems = Boolean(preview?.hasPreorderItems);
  const minAdvanceHours = useMemo(() => {
    if (!preview?.items?.length) return 24;
    const hours = preview.items
      .filter((item) => item.isPreorderOnly)
      .map((item) => Number(item.minAdvanceHours) || 24);
    return hours.length ? Math.max(...hours) : 24;
  }, [preview]);

  const deliveryFeeEstimate = useMemo(
    () => estimateDeliveryFee(form.deliveryArea, subtotal, rules),
    [form.deliveryArea, subtotal, rules]
  );
  const total = subtotal + wrapTotal + deliveryFeeEstimate;

  const updateAddress = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, deliveryAddress: { ...prev.deliveryAddress, [key]: value } }));
  };
  const updateField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const focus = (field) => () => setFocused(field);
  const blur = () => setFocused(null);

  const inputStyle = (field) => {
    if (fieldErrors[field]) return { ...inputBase, borderColor: colors.error };
    if (focused === field) return { ...inputBase, borderColor: colors.primary, boxShadow: '0 0 0 3px rgba(30,107,60,0.12)' };
    return inputBase;
  };

  const fieldErr = (id) => fieldErrors[id]
    ? <span style={{ fontSize: '12px', color: colors.error, display: 'block', marginTop: '4px' }}>{fieldErrors[id]}</span>
    : null;

  const validateClientSide = () => {
    const fields = {};
    const street = (form.deliveryAddress.street ?? "").trim();
    if (!street) {
      fields["deliveryAddress.street"] = t("streetEmpty");
    }
    if (!form.deliveryArea) {
      fields.deliveryArea = t("deliveryAreaRequired");
    }
    if (hasPreorderItems) {
      if (!form.preferredDeliveryAt) {
        fields.preferredDeliveryAt = t("preorderDateRequired");
      } else {
        const target = new Date(form.preferredDeliveryAt);
        const minMs = minAdvanceHours * 60 * 60 * 1000;
        if (Number.isNaN(target.getTime()) || target.getTime() - Date.now() < minMs) {
          fields.preferredDeliveryAt = t("preorderDateTooSoon", { hours: minAdvanceHours });
        }
      }
    }
    const phone = (form.customerPhone ?? "").trim();
    if (!phone) {
      fields.customerPhone = t("phoneRequired");
    } else if (phone.length < 7) {
      fields.customerPhone = t("phoneInvalid");
    }
    if (!form.paymentMethod || !PAYMENT_METHODS.some((m) => m.value === form.paymentMethod)) {
      fields.paymentMethod = t("paymentMethodRequired");
    }
    if (Object.keys(fields).length > 0) {
      return { ok: false, fields };
    }
    return { ok: true };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setFieldErrors({});

    const clientCheck = validateClientSide();
    if (!clientCheck.ok) {
      pendingScrollToFirstErrorRef.current = true;
      setFieldErrors(clientCheck.fields);
      setSubmitting(false);
      return;
    }

    const payload = {
      deliveryAddress: { ...form.deliveryAddress },
      deliveryArea: form.deliveryArea,
      customerPhone: form.customerPhone,
      notes: form.notes,
      paymentMethod: form.paymentMethod
    };
    if (hasPreorderItems && form.preferredDeliveryAt) {
      payload.preferredDeliveryAt = new Date(form.preferredDeliveryAt).toISOString();
    }
    if (form.customRequest) payload.customRequest = form.customRequest;

    try {
      const order = await orderService.createOrder(payload);
      clearOrderSuccessStorage();
      try {
        await refreshCart();
      } catch {
        /* cart refresh is best-effort after order */
      }
      navigate(`/orders/${order._id}`, { replace: true });
    } catch (err) {
      const fields = fieldErrorsFromResponse(err);
      if (Object.keys(fields).length > 0) {
        pendingScrollToFirstErrorRef.current = true;
        setFieldErrors(fields);
      } else {
        setSubmitError(err.userMessage || t("placeOrderError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (previewLoading) {
    return (
      <section style={pageStyle}>
        <h1 style={{ margin: '0 0 32px', fontSize: '30px', fontWeight: 700, color: colors.textPrimary }}>
          {t("title")}
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={44} />
          ))}
        </div>
      </section>
    );
  }

  if (previewError) {
    return (
      <section style={pageStyle}>
        <h1 style={{ margin: '0 0 20px', fontSize: '30px', fontWeight: 700, color: colors.textPrimary }}>
          {t("title")}
        </h1>
        <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorSurface, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', marginBottom: '16px' }}>
          {previewError}
        </div>
        <Link to="/cart" style={{ color: colors.primary, fontWeight: 600 }}>{t("backToCart")}</Link>
      </section>
    );
  }

  if (!preview || !preview.items?.length) {
    return (
      <section style={pageStyle}>
        <h1 style={{ margin: '0 0 20px', fontSize: '30px', fontWeight: 700, color: colors.textPrimary }}>
          {t("title")}
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '15px', marginBottom: '16px' }}>{t("cartEmpty")}</p>
        <Link to="/" style={{ color: colors.primary, fontWeight: 600 }}>{t("continueShopping")}</Link>
      </section>
    );
  }

  return (
    <section style={pageStyle}>
      <h1 style={{ margin: '0 0 32px', fontSize: '30px', fontWeight: 700, color: colors.textPrimary }}>
        {t("title")}
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isNarrow ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 340px)',
        gap: isNarrow ? '24px' : '32px',
        alignItems: 'start',
      }}>

        {/* Form */}
        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, width: '100%' }}>

          {/* Delivery address */}
          <div
            id="checkout-delivery"
            style={{ ...sectionStyle, scrollMarginTop: "80px" }}
          >
            <h3 style={sectionTitleStyle}>{t("deliveryAddress")}</h3>
            <label style={labelStyle}>
              {t("streetRequired")}
              <input ref={assignFieldRef("deliveryAddress.street")} value={form.deliveryAddress.street} onChange={updateAddress("street")} maxLength={120} required onFocus={focus("street")} onBlur={blur} style={inputStyle("deliveryAddress.street")} />
              {fieldErr("deliveryAddress.street")}
            </label>
            <label style={labelStyle}>
              {t("building")}
              <input ref={assignFieldRef("deliveryAddress.building")} value={form.deliveryAddress.building} onChange={updateAddress("building")} maxLength={50} onFocus={focus("building")} onBlur={blur} style={inputStyle("deliveryAddress.building")} />
              {fieldErr("deliveryAddress.building")}
            </label>
            <label style={labelStyle}>
              {t("apartment")}
              <input ref={assignFieldRef("deliveryAddress.apartment")} value={form.deliveryAddress.apartment} onChange={updateAddress("apartment")} maxLength={50} onFocus={focus("apartment")} onBlur={blur} style={inputStyle("deliveryAddress.apartment")} />
              {fieldErr("deliveryAddress.apartment")}
            </label>
            <label style={labelStyle}>
              {t("addressNotes")}
              <textarea ref={assignFieldRef("deliveryAddress.notes")} value={form.deliveryAddress.notes} onChange={updateAddress("notes")} maxLength={500} rows={2} onFocus={focus("addressNotes")} onBlur={blur} style={{ ...inputStyle("deliveryAddress.notes"), resize: 'vertical' }} />
              {fieldErr("deliveryAddress.notes")}
            </label>
          </div>

          {/* Delivery area */}
          <label style={labelStyle}>
            {t("deliveryAreaRequired")}
            <select ref={assignFieldRef("deliveryArea")} value={form.deliveryArea} onChange={updateField("deliveryArea")} required onFocus={focus("deliveryArea")} onBlur={blur} style={inputStyle("deliveryArea")}>
              <option value="" disabled>{t("deliveryAreaPlaceholder")}</option>
              {areas.map((area) => (
                <option key={area.key} value={area.key}>
                  {deliveryAreaOptionLabel(area, lang, t)}
                  {area.key === localAreaKey ? " ★" : ""}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '12px', color: colors.textMuted, display: 'block', whiteSpace: 'pre-line', marginTop: '4px' }}>
              {t("deliveryAreaHelper", {
                localMin: rules.localFreeDeliveryMin,
                localFee: rules.localDeliveryFee,
                outsideMin: rules.outsideFreeDeliveryMin,
                outsideFee: rules.outsideDeliveryFee
              })}
            </span>
            {fieldErr("deliveryArea")}
          </label>

          {/* Preorder section */}
          {hasPreorderItems && (
            <div style={{ ...sectionStyle, border: `1px solid ${colors.warningBorder}`, background: colors.warningSurface }}>
              <h3 style={{ ...sectionTitleStyle, color: colors.warning }}>{t("preorderNotice")}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: colors.warning }}>{t("preorderHelper", { hours: minAdvanceHours })}</p>
              <label style={labelStyle}>
                {t("preorderDateRequired")}
                <input ref={assignFieldRef("preferredDeliveryAt")} type="datetime-local" value={form.preferredDeliveryAt} onChange={updateField("preferredDeliveryAt")} min={minDateTimeLocal(minAdvanceHours)} required onFocus={focus("preferredDeliveryAt")} onBlur={blur} style={inputStyle("preferredDeliveryAt")} />
                {fieldErr("preferredDeliveryAt")}
              </label>
              <label style={labelStyle}>
                {t("customRequest")}
                <textarea ref={assignFieldRef("customRequest")} value={form.customRequest} onChange={updateField("customRequest")} placeholder={t("customRequestPlaceholder")} maxLength={1000} rows={3} onFocus={focus("customRequest")} onBlur={blur} style={{ ...inputStyle("customRequest"), resize: 'vertical' }} />
                {fieldErr("customRequest")}
              </label>
            </div>
          )}

          {/* Phone */}
          <label style={labelStyle}>
            {t("phoneRequired")}
            <input ref={assignFieldRef("customerPhone")} value={form.customerPhone} onChange={updateField("customerPhone")} minLength={7} maxLength={20} required onFocus={focus("phone")} onBlur={blur} style={inputStyle("customerPhone")} />
            {fieldErr("customerPhone")}
          </label>

          {/* Order notes */}
          <label style={labelStyle}>
            {t("orderNotes")}
            <textarea ref={assignFieldRef("notes")} value={form.notes} onChange={updateField("notes")} maxLength={1000} rows={3} onFocus={focus("notes")} onBlur={blur} style={{ ...inputStyle("notes"), resize: 'vertical' }} />
            {fieldErr("notes")}
          </label>

          {/* Payment method */}
          <div ref={assignFieldRef("paymentMethod")}>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontSize: '14px', fontWeight: 500, color: colors.textSecondary, marginBottom: '10px', display: 'block' }}>
              {t("paymentMethodRequired")}
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  style={{
                    display: 'flex', gap: '10px', alignItems: 'center',
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                    border: `1.5px solid ${form.paymentMethod === method.value ? colors.primary : colors.border}`,
                    background: form.paymentMethod === method.value ? colors.primarySurface : colors.surface,
                    fontSize: '14px', fontWeight: 500, color: colors.textPrimary,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <input type="radio" name="paymentMethod" value={method.value} checked={form.paymentMethod === method.value} onChange={updateField("paymentMethod")} />
                  {t(`paymentMethods.${method.value}`)}
                </label>
              ))}
            </div>
            {fieldErr("paymentMethod")}
          </fieldset>
          </div>

          {/* Submit error */}
          <AnimatePresence>
            {submitError && (
              <motion.div key="submit-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorSurface, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', lineHeight: 1.5 }}>
                  {submitError}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={!submitting ? { scale: 1.02 } : {}}
            whileTap={!submitting ? { scale: 0.96 } : {}}
            transition={{ duration: 0.12 }}
            style={{
              padding: '12px 20px', borderRadius: '10px', border: 'none',
              background: submitting ? colors.border : colors.primary,
              color: submitting ? colors.textMuted : colors.textInverse,
              fontSize: '15px', fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 4px 14px rgba(30,107,60,0.30)',
              width: '100%',
            }}
          >
            {submitting ? t("placingOrder") : t("placeOrder")}
          </motion.button>
        </form>

        {/* Order summary aside */}
        <aside style={{
          background: colors.surfaceRaised,
          border: `1px solid ${colors.border}`,
          borderRadius: '14px',
          padding: '24px',
          position: isNarrow ? 'static' : 'sticky',
          top: isNarrow ? 'auto' : '80px',
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: 600, color: colors.textPrimary }}>
            {t("orderSummary")}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {preview.items.map((item) => (
              <div key={item.product} style={{ padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '14px' }}>
                  <span style={{ color: colors.textPrimary }}>
                    {getLocalizedProductName({ name: item.nameLocales ?? item.name }, lang)} × {item.quantity}
                    {item.isPreorderOnly ? " ⏱" : ""}
                    {item.wrap && (
                      <span style={{ marginInlineStart: '6px', padding: '1px 6px', borderRadius: '9999px', fontSize: '11px', background: colors.successSurface, color: colors.success, border: `1px solid ${colors.successBorder}` }}>
                        {t("wrapBadge")}
                      </span>
                    )}
                  </span>
                  <span style={{ fontWeight: 600, color: colors.textPrimary, flexShrink: 0 }}>
                    {formatPrice(item.lineTotal, lang)}
                  </span>
                </div>
                {item.wrap && Number(item.wrapFee) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px', color: colors.success, marginTop: '4px' }}>
                    <span>↳ {t("wrapFees")}</span>
                    <span>+{formatPrice(item.wrapFee, lang)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: colors.textSecondary }}>
              <span>{t("subtotal")}</span>
              <span>{formatPrice(subtotal, lang)}</span>
            </div>
            {wrapTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: colors.success }}>
                <span>{t("wrapFees")}</span>
                <span>{formatPrice(wrapTotal, lang)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: colors.textSecondary }}>
              <span>{t("deliveryFee")}</span>
              <span>{formatPrice(deliveryFeeEstimate, lang)}</span>
            </div>
            <span style={{ fontSize: '11px', color: colors.textMuted }}>{t("feeEstimateNote")}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: colors.textPrimary, paddingTop: '10px', borderTop: `1px solid ${colors.border}`, marginTop: '4px' }}>
              <span>{t("total")}</span>
              <span>{formatPrice(total, lang)}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default CheckoutPage;
