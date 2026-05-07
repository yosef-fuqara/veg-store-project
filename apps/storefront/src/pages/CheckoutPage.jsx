import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { DELIVERY_ZONES, PAYMENT_METHODS, getDeliveryFee } from "../config/delivery";
import * as cartService from "../services/cartService";
import * as orderService from "../services/orderService";
import { formatPrice } from "../utils/formatPrice";

const initialForm = {
  deliveryAddress: {
    label: "",
    city: "",
    street: "",
    building: "",
    apartment: "",
    notes: ""
  },
  deliveryZone: DELIVERY_ZONES[0].key,
  customerPhone: "",
  notes: "",
  paymentMethod: PAYMENT_METHODS[0].value
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

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("checkout");
  const lang = (i18n.language || "he").split("-")[0];

  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);

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
        const checkout = await cartService.prepareCheckout();
        if (cancelled) return;
        setPreview(checkout);
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
  const deliveryFee = useMemo(() => getDeliveryFee(form.deliveryZone), [form.deliveryZone]);
  const total = subtotal + deliveryFee;

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setFieldErrors({});

    const payload = {
      deliveryAddress: { ...form.deliveryAddress },
      deliveryZone: form.deliveryZone,
      customerPhone: form.customerPhone,
      notes: form.notes,
      paymentMethod: form.paymentMethod
    };

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
              {t("labelOptional")}
              <input
                value={form.deliveryAddress.label}
                onChange={updateAddress("label")}
                maxLength={50}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
              {fieldError("deliveryAddress.label")}
            </label>
            <label>
              {t("cityRequired")}
              <input
                value={form.deliveryAddress.city}
                onChange={updateAddress("city")}
                maxLength={80}
                required
                style={{ width: "100%", boxSizing: "border-box" }}
              />
              {fieldError("deliveryAddress.city")}
            </label>
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
            {t("deliveryZoneRequired")}
            <select
              value={form.deliveryZone}
              onChange={updateField("deliveryZone")}
              required
              style={{ width: "100%", boxSizing: "border-box" }}
            >
              {DELIVERY_ZONES.map((zone) => (
                <option key={zone.key} value={zone.key}>
                  {t(`zones.${zone.key}`)} ({t("fee")} {formatPrice(zone.fee, lang)})
                </option>
              ))}
            </select>
            {fieldError("deliveryZone")}
          </label>

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
            <span>{formatPrice(deliveryFee, lang)}</span>
          </div>
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
