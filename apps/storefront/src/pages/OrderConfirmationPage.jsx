import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as orderService from "../services/orderService";

const paymentStatusMessage = (status) => {
  switch (status) {
    case "pending_payment":
      return "Awaiting payment confirmation.";
    case "bank_transfer_pending":
      return "Please complete the bank transfer; an admin will confirm.";
    case "paid":
    case "bank_transfer_approved":
      return "Payment received.";
    case "failed":
      return "Payment failed.";
    case "cancelled":
      return "Payment was cancelled.";
    default:
      return null;
  }
};

const OrderConfirmationPage = () => {
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
      setError(err.userMessage || "Could not load order.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p>Loading order...</p>;
  }

  if (error || !order) {
    return (
      <section>
        <h2>Order</h2>
        <p style={{ color: "crimson" }}>{error || "Order not found."}</p>
        <Link to="/">Home</Link>
      </section>
    );
  }

  const statusNote = paymentStatusMessage(order.paymentStatus);

  return (
    <section>
      <h2>Order confirmation</h2>
      <p>
        <strong>Order ID:</strong> {order._id}
      </p>
      <p>
        <strong>Status:</strong> {order.orderStatus}
      </p>
      <p>
        <strong>Payment:</strong> {order.paymentStatus}
      </p>
      {statusNote ? <p>{statusNote}</p> : null}
      <p>
        <strong>Payment method:</strong> {order.paymentMethod}
      </p>
      <p>
        <strong>Phone:</strong> {order.customerPhone}
      </p>

      <h3>Delivery</h3>
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
        <strong>Zone:</strong> {order.deliveryZone}
      </p>
      {order.notes ? (
        <p>
          <strong>Your notes:</strong> {order.notes}
        </p>
      ) : null}

      <h3>Items</h3>
      <ul>
        {(order.items || []).map((item, index) => (
          <li key={`${item.product}-${index}`}>
            {item.name} x {item.quantity} @ {item.price} = {item.price * item.quantity}
          </li>
        ))}
      </ul>
      <p>Subtotal: {order.subtotal}</p>
      <p>Delivery: {order.deliveryFee}</p>
      <p>
        <strong>Total: {order.total}</strong>
      </p>

      <p style={{ marginTop: 16 }}>
        <button type="button" onClick={load}>
          Refresh status
        </button>
      </p>
      <p>
        <Link to="/">Continue shopping</Link>
      </p>
    </section>
  );
};

export default OrderConfirmationPage;
