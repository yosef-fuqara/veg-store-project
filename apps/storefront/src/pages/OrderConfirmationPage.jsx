import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import * as orderService from "../services/orderService";
import { formatPrice } from "../utils/formatPrice";

const paymentStatusMessage = (status, t) => {
  switch (status) {
    case "pending_payment":
      return t("paymentStatusMessage.pending_payment");
    case "bank_transfer_pending":
      return t("paymentStatusMessage.bank_transfer_pending");
    case "paid":
    case "bank_transfer_approved":
      return t("paymentStatusMessage.paid");
    case "failed":
      return t("paymentStatusMessage.failed");
    case "cancelled":
      return t("paymentStatusMessage.cancelled");
    default:
      return null;
  }
};

const OrderConfirmationPage = () => {
  const { t, i18n } = useTranslation("order");
  const lang = (i18n.language || "he").split("-")[0];
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await orderService.getOrder(id);
      setOrder(data);
    } catch (err) {
      setOrder(null);
      setError(err.userMessage || t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p>{t("loading")}</p>;
  }

  if (error || !order) {
    return (
      <section>
        <h2>{t("title")}</h2>
        <p style={{ color: "crimson" }}>{error || t("notFound")}</p>
        <Link to="/">{t("home")}</Link>
      </section>
    );
  }

  const statusNote = paymentStatusMessage(order.paymentStatus, t);

  return (
    <section>
      <h2>{t("confirmationTitle")}</h2>
      <p>
        <strong>{t("orderId")}:</strong> {order._id}
      </p>
      <p>
        <strong>{t("status")}:</strong> {order.orderStatus}
      </p>
      <p>
        <strong>{t("payment")}:</strong> {order.paymentStatus}
      </p>
      {statusNote ? <p>{statusNote}</p> : null}
      <p>
        <strong>{t("paymentMethod")}:</strong> {order.paymentMethod}
      </p>
      <p>
        <strong>{t("phone")}:</strong> {order.customerPhone}
      </p>

      <h3>{t("delivery")}</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {order.deliveryAddress
          ? [
              order.deliveryAddress.label,
              order.deliveryAddress.city,
              order.deliveryAddress.street,
              order.deliveryAddress.building,
              order.deliveryAddress.apartment,
              order.deliveryAddress.notes
            ]
              .filter(Boolean)
              .join(", ")
          : "—"}
      </p>
      <p>
        <strong>{t("zone")}:</strong> {order.deliveryZone}
      </p>
      {order.notes ? (
        <p>
          <strong>{t("yourNotes")}:</strong> {order.notes}
        </p>
      ) : null}

      <h3>{t("items")}</h3>
      <ul>
        {(order.items || []).map((item, index) => (
          <li key={`${item.product}-${index}`}>
            {item.name} x {item.quantity} @ {formatPrice(item.price, lang)} ={" "}
            {formatPrice(item.price * item.quantity, lang)}
          </li>
        ))}
      </ul>
      <p>
        {t("subtotal")}: {formatPrice(order.subtotal, lang)}
      </p>
      <p>
        {t("deliveryFee")}: {formatPrice(order.deliveryFee, lang)}
      </p>
      <p>
        <strong>
          {t("total")}: {formatPrice(order.total, lang)}
        </strong>
      </p>

      <p style={{ marginTop: 16 }}>
        <button type="button" onClick={load}>
          {t("refreshStatus")}
        </button>
      </p>
      <p>
        <Link to="/">{t("continueShopping")}</Link>
      </p>
    </section>
  );
};

export default OrderConfirmationPage;
