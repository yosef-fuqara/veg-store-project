import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useToast } from "../features/toast/ToastContext";
import {
  getAdminOrderById,
  updateAdminOrderPaymentStatus,
  updateAdminOrderStatus
} from "../services/orderService";

const ORDER_STATUS_OPTIONS = [
  "new",
  "confirmed",
  "preparing",
  "ready_for_delivery",
  "sent_with_delivery_company",
  "delivered",
  "cancelled"
];

const PAYMENT_STATUS_OPTIONS = ["bank_transfer_approved", "failed", "cancelled"];

const formatCurrency = (value) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const AdminOrderDetailsPage = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [nextOrderStatus, setNextOrderStatus] = useState("");
  const [nextPaymentStatus, setNextPaymentStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminOrderById(id);
      setOrder(data);
      setNextOrderStatus(data?.orderStatus || "");
      setNextPaymentStatus(data?.paymentStatus || "");
    } catch (err) {
      setError(err.userMessage || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    if (!order) return null;
    return {
      subtotal: formatCurrency(order.subtotal),
      deliveryFee: formatCurrency(order.deliveryFee),
      total: formatCurrency(order.total)
    };
  }, [order]);

  const handleOrderStatusUpdate = async () => {
    if (!order || !nextOrderStatus || nextOrderStatus === order.orderStatus) return;
    setError("");
    setUpdating(true);
    try {
      const updated = await updateAdminOrderStatus(order._id, nextOrderStatus);
      setOrder(updated);
      setNextOrderStatus(updated.orderStatus || "");
      showToast("Order status updated.");
    } catch (err) {
      const message = err.userMessage || "Failed to update order status";
      setError(message);
      showToast(message, "error");
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusUpdate = async () => {
    if (!order || !nextPaymentStatus || nextPaymentStatus === order.paymentStatus) return;
    setError("");
    setUpdating(true);
    try {
      const updated = await updateAdminOrderPaymentStatus(order._id, nextPaymentStatus);
      setOrder(updated);
      setNextPaymentStatus(updated.paymentStatus || "");
      showToast("Payment status updated.");
    } catch (err) {
      const message = err.userMessage || "Failed to update payment status";
      setError(message);
      showToast(message, "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p>Loading order...</p>;

  if (error && !order) {
    return (
      <section>
        <p style={{ color: "crimson" }}>{error}</p>
        <button type="button" onClick={load}>
          Retry
        </button>
      </section>
    );
  }

  if (!order) return <p>Order not found.</p>;

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Order Details</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={load} disabled={loading || updating}>
            Refresh
          </button>
          <Link to="/orders">Back to orders</Link>
        </div>
      </div>

      {error ? <p style={{ color: "crimson", margin: 0 }}>{error}</p> : null}

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <p>
          <strong>Order ID:</strong> {order._id}
        </p>
        <p>
          <strong>Customer:</strong> {order.user?.name || "-"} ({order.user?.email || "-"})
        </p>
        <p>
          <strong>Phone:</strong> {order.user?.phone || order.customerPhone || "-"}
        </p>
        <p>
          <strong>Created:</strong> {formatDate(order.createdAt)}
        </p>
        <p>
          <strong>Updated:</strong> {formatDate(order.updatedAt)}
        </p>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <h2>Items</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
                Product
              </th>
              <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
                Qty
              </th>
              <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
                Unit Price
              </th>
              <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
                Line Total
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={`${item.product || item.name}-${idx}`}>
                <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{item.name}</td>
                <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>
                  {item.quantity} {item.unit}
                </td>
                <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{formatCurrency(item.price)}</td>
                <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>
                  {formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          <strong>Subtotal:</strong> {totals?.subtotal}
        </p>
        <p>
          <strong>Delivery Fee:</strong> {totals?.deliveryFee}
        </p>
        <p>
          <strong>Total:</strong> {totals?.total}
        </p>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <h2>Delivery Address</h2>
        <p>
          {order.deliveryAddress?.city}, {order.deliveryAddress?.street}
          {order.deliveryAddress?.building ? ` ${order.deliveryAddress.building}` : ""}
          {order.deliveryAddress?.apartment ? `, Apt ${order.deliveryAddress.apartment}` : ""}
        </p>
        {order.deliveryAddress?.label ? <p>Label: {order.deliveryAddress.label}</p> : null}
        {order.deliveryAddress?.notes ? <p>Address Notes: {order.deliveryAddress.notes}</p> : null}
        <p>
          <strong>Delivery Zone:</strong> {order.deliveryZone || "-"}
        </p>
      </section>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, display: "grid", gap: 10 }}>
        <h2>Payment and Status</h2>
        <p>
          <strong>Payment Method:</strong> {order.paymentMethod || "-"}
        </p>
        <p>
          <strong>Current Payment Status:</strong> {order.paymentStatus || "-"}
        </p>
        <p>
          <strong>Current Order Status:</strong> {order.orderStatus || "-"}
        </p>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label>
            Order Status
            <select
              value={nextOrderStatus}
              onChange={(event) => setNextOrderStatus(event.target.value)}
              style={{ marginInlineStart: 8 }}
            >
              {ORDER_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={handleOrderStatusUpdate} disabled={updating || nextOrderStatus === order.orderStatus}>
            Update Order Status
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label>
            Payment Status
            <select
              value={nextPaymentStatus}
              onChange={(event) => setNextPaymentStatus(event.target.value)}
              style={{ marginInlineStart: 8 }}
            >
              {[order.paymentStatus, ...PAYMENT_STATUS_OPTIONS]
                .filter((value, index, arr) => value && arr.indexOf(value) === index)
                .map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handlePaymentStatusUpdate}
            disabled={updating || nextPaymentStatus === order.paymentStatus}
          >
            Update Payment Status
          </button>
        </div>
      </section>
    </section>
  );
};

export default AdminOrderDetailsPage;
