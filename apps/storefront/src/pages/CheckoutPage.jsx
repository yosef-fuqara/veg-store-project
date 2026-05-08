import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
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
import * as cartService from "../services/cartService";
import * as orderService from "../services/orderService";
import { formatPrice } from "../utils/formatPrice";

const initialForm = {
  deliveryAddress: {
    street: "",
    building: "",
    apartment: "",
    notes: ""
  },
  deliveryArea: "",
  customerPhone: "",
  notes: "",
  paymentMethod: PAYMENT_METHODS[0].value,
  preferredDeliveryAt: "",
  customRequest: ""
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

// HTML datetime-local needs `YYYY-MM-DDTHH:mm`. Default to "now + hours" hours.
const minDateTimeLocal = (hoursAhead) => {
  const target = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(
    target.getHours()
  )}:${pad(target.getMinutes())}`;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("checkout");
  const lang = (i18n.language || "he").split("-")[0];

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

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

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
        if (deliveryInfo?.areas?.length) {
          setAreas(deliveryInfo.areas);
        }
        if (deliveryInfo?.localAreaKey) {
          setLocalAreaKey(deliveryInfo.localAreaKey);
        }
        if (deliveryInfo?.rules) {
          setRules(deliveryInfo.rules);
        }
      } catch (err) {
        if (cancelled) return;
        setPreview(null);
        setPreviewError(err.userMessage || t("previewLoadError"));
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const subtotal = preview?.subtotal ?? 0;
  const hasPreorderItems = Boolean(preview?.hasPreorderItems);
  // Strictest minimum (default 24h) across preorder items in the cart.
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
  const total = subtotal + deliveryFeeEstimate;

  const updateAddress = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      deliveryAddress: { ...prev.deliveryAddress, [key]: value }
    }));
  };

  const updateField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const validateClientSide = () => {
    if (!form.deliveryArea) {
      return { ok: false, fields: { deliveryArea: t("deliveryAreaRequired") } };
    }
    if (hasPreorderItems) {
      if (!form.preferredDeliveryAt) {
        return {
          ok: false,
          fields: {
            preferredDeliveryAt: t("preorderDateRequired")
          }
        };
      }
      const target = new Date(form.preferredDeliveryAt);
      const minMs = minAdvanceHours * 60 * 60 * 1000;
      if (
        Number.isNaN(target.getTime()) ||
        target.getTime() - Date.now() < minMs
      ) {
        return {
          ok: false,
          fields: {
            preferredDeliveryAt: t("preorderDateTooSoon", { hours: minAdvanceHours })
          }
        };
      }
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
    if (form.customRequest) {
      payload.customRequest = form.customRequest;
    }

    try {
      const order = await orderService.createOrder(payload);
      navigate(`/orders/${order._id}`, { replace: true });
    } catch (err) {
      const fields = fieldErrorsFromResponse(err);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
      } else {
        setSubmitError(err.userMessage || t("placeOrderError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (previewLoading) {
    return <p>{t("loading")}</p>;
  }

  if (previewError) {
    return (
      <section>
        <h2>{t("title")}</h2>
        <p style={{ color: "crimson" }}>{previewError}</p>
        <p>
          <Link to="/cart">{t("backToCart")}</Link>
        </p>
      </section>
    );
  }

  if (!preview || !preview.items?.length) {
    return (
      <section>
        <h2>{t("title")}</h2>
        <p>{t("cartEmpty")}</p>
        <p>
          <Link to="/">{t("continueShopping")}</Link>
        </p>
      </section>
    );
  }

  const fieldError = (key) =>
    fieldErrors[key] ? (
      <small style={{ color: "crimson", display: "block" }}>{fieldErrors[key]}</small>
    ) : null;

  return (
    <section>
      <h2>{t("title")}</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 320px)",
          gap: 24,
          alignItems: "start"
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          <fieldset style={{ display: "grid", gap: 8, border: "1px solid #ccc", padding: 12 }}>
            <legend>{t("deliveryAddress")}</legend>
            <label>
              {t("streetRequired")}
              <input
                value={form.deliveryAddress.street}
                onChange={updateAddress("street")}
                maxLength={120}
                required
                style={{ width: "100%", boxSizing: "border-box" }}
              />
              {fieldError("deliveryAddress.street")}
            </label>
            <label>
              {t("building")}
              <input
                value={form.deliveryAddress.building}
                onChange={updateAddress("building")}
                maxLength={50}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
              {fieldError("deliveryAddress.building")}
            </label>
            <label>
              {t("apartment")}
              <input
                value={form.deliveryAddress.apartment}
                onChange={updateAddress("apartment")}
                maxLength={50}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
              {fieldError("deliveryAddress.apartment")}
            </label>
            <label>
              {t("addressNotes")}
              <textarea
                value={form.deliveryAddress.notes}
                onChange={updateAddress("notes")}
                maxLength={500}
                rows={2}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
              {fieldError("deliveryAddress.notes")}
            </label>
          </fieldset>

          <label>
            {t("deliveryAreaRequired")}
            <select
              value={form.deliveryArea}
              onChange={updateField("deliveryArea")}
              required
              style={{ width: "100%", boxSizing: "border-box" }}
            >
              <option value="" disabled>
                {t("deliveryAreaPlaceholder")}
              </option>
              {areas.map((area) => (
                <option key={area.key} value={area.key}>
                  {t(`areas.${area.key}`, { defaultValue: area.label })}
                  {area.key === localAreaKey ? " ★" : ""}
                </option>
              ))}
            </select>
            <small style={{ color: "#555", display: "block", whiteSpace: "pre-line" }}>
              {t("deliveryAreaHelper", {
                localMin: rules.localFreeDeliveryMin,
                localFee: rules.localDeliveryFee,
                outsideMin: rules.outsideFreeDeliveryMin,
                outsideFee: rules.outsideDeliveryFee
              })}
            </small>
            {fieldError("deliveryArea")}
          </label>

          {hasPreorderItems ? (
            <fieldset style={{ display: "grid", gap: 6, border: "1px solid #f59e0b", padding: 12, background: "#fffbeb" }}>
              <legend style={{ color: "#92400e" }}>{t("preorderNotice")}</legend>
              <p style={{ margin: 0, color: "#92400e" }}>
                {t("preorderHelper", { hours: minAdvanceHours })}
              </p>
              <label>
                {t("preorderDateRequired")}
                <input
                  type="datetime-local"
                  value={form.preferredDeliveryAt}
                  onChange={updateField("preferredDeliveryAt")}
                  min={minDateTimeLocal(minAdvanceHours)}
                  required
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
                {fieldError("preferredDeliveryAt")}
              </label>
              <label>
                {t("customRequest")}
                <textarea
                  value={form.customRequest}
                  onChange={updateField("customRequest")}
                  placeholder={t("customRequestPlaceholder")}
                  maxLength={1000}
                  rows={3}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
                {fieldError("customRequest")}
              </label>
            </fieldset>
          ) : null}

          <label>
            {t("phoneRequired")}
            <input
              value={form.customerPhone}
              onChange={updateField("customerPhone")}
              minLength={7}
              maxLength={20}
              required
              style={{ width: "100%", boxSizing: "border-box" }}
            />
            {fieldError("customerPhone")}
          </label>

          <label>
            {t("orderNotes")}
            <textarea
              value={form.notes}
              onChange={updateField("notes")}
              maxLength={1000}
              rows={3}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
            {fieldError("notes")}
          </label>

          <fieldset style={{ display: "grid", gap: 6, border: "1px solid #ccc", padding: 12 }}>
            <legend>{t("paymentMethodRequired")}</legend>
            {PAYMENT_METHODS.map((method) => (
              <label key={method.value} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={form.paymentMethod === method.value}
                  onChange={updateField("paymentMethod")}
                />
                {t(`paymentMethods.${method.value}`)}
              </label>
            ))}
            {fieldError("paymentMethod")}
          </fieldset>

          {submitError ? <p style={{ color: "crimson" }}>{submitError}</p> : null}

          <button type="submit" disabled={submitting}>
            {submitting ? t("placingOrder") : t("placeOrder")}
          </button>
        </form>

        <aside style={{ background: "#f4f4f4", padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t("orderSummary")}</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {preview.items.map((item) => (
              <li
                key={item.product}
                style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 8 }}
              >
                <span>
                  {item.name} x {item.quantity}
                  {item.isPreorderOnly ? " ⏱" : ""}
                </span>
                <span>{formatPrice(item.lineTotal, lang)}</span>
              </li>
            ))}
          </ul>
          <hr />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{t("subtotal")}</span>
            <span>{formatPrice(subtotal, lang)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{t("deliveryFee")}</span>
            <span>{formatPrice(deliveryFeeEstimate, lang)}</span>
          </div>
          <small style={{ color: "#666", display: "block" }}>{t("feeEstimateNote")}</small>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              marginTop: 8
            }}
          >
            <span>{t("total")}</span>
            <span>{formatPrice(total, lang)}</span>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default CheckoutPage;
