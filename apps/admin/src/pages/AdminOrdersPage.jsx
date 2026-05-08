import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminOrders } from "../services/orderService";

const ORDER_STATUS_OPTIONS = [
  "all",
  "new",
  "confirmed",
  "preparing",
  "ready_for_delivery",
  "sent_with_delivery_company",
  "delivered",
  "cancelled"
];

const BADGE_BASE_STYLE = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  lineHeight: "18px",
  whiteSpace: "nowrap"
};

const ORDER_STATUS_BADGES = {
  new: { background: "#eff6ff", color: "#1d4ed8" },
  confirmed: { background: "#ecfeff", color: "#0e7490" },
  preparing: { background: "#f5f3ff", color: "#6d28d9" },
  ready_for_delivery: { background: "#ecfccb", color: "#3f6212" },
  sent_with_delivery_company: { background: "#fff7ed", color: "#c2410c" },
  delivered: { background: "#ecfdf3", color: "#027a48" },
  cancelled: { background: "#fef2f2", color: "#b42318" }
};

const PAYMENT_STATUS_BADGES = {
  pending_payment: { background: "#fff7ed", color: "#c2410c" },
  paid: { background: "#ecfdf3", color: "#027a48" },
  failed: { background: "#fef2f2", color: "#b42318" },
  cancelled: { background: "#fef2f2", color: "#b42318" },
  bank_transfer_pending: { background: "#fff7ed", color: "#c2410c" },
  bank_transfer_approved: { background: "#ecfdf3", color: "#027a48" }
};

const formatStatusText = (status) => String(status || "-").replaceAll("_", " ");

const StatusBadge = ({ value, palette }) => {
  const colors = palette[value] || { background: "#f8fafc", color: "#334155" };
  return <span style={{ ...BADGE_BASE_STYLE, ...colors }}>{formatStatusText(value)}</span>;
};

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

const customerText = (order) => {
  const user = order?.user;
  if (!user) return "-";
  return user.name || user.email || user.phone || "-";
};

const PREORDER_BADGE_STYLE = {
  ...BADGE_BASE_STYLE,
  background: "#fffbeb",
  color: "#92400e",
  border: "1px solid #fde68a",
  marginInlineStart: 6
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = statusFilter === "all" ? {} : { orderStatus: statusFilter };
      const data = await getAdminOrders(query);
      setOrders(data);
    } catch (err) {
      setError(err.userMessage || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p>Loading orders...</p>;

  if (error) {
    return (
      <section>
        <p style={{ color: "crimson" }}>{error}</p>
        <button type="button" onClick={load}>
          Retry
        </button>
      </section>
    );
  }

  if (!orders.length) {
    return (
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Orders</h1>
          <button type="button" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>
            Order Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={{ marginInlineStart: 8 }}
            >
              {ORDER_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
        {statusFilter === "all" ? <p>No orders found.</p> : <p>No orders found for this status.</p>}
        {statusFilter !== "all" ? (
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
            }}
          >
            Show all orders
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Orders</h1>
        <button type="button" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>
          Order Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{ marginInlineStart: 8 }}
          >
            {ORDER_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p style={{ color: "#666", marginTop: 0 }}>
        Showing {orders.length} orders{statusFilter !== "all" ? ` for status: ${statusFilter}` : ""}.
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
              Order ID
            </th>
            <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
              Customer
            </th>
            <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
              Total
            </th>
            <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
              Payment Method
            </th>
            <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
              Payment Status
            </th>
            <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
              Order Status
            </th>
            <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>
                <Link to={`/orders/${order._id}`}>{order._id}</Link>
                {order.hasPreorderItems ? (
                  <span style={PREORDER_BADGE_STYLE} title="Contains preorder/custom platter items">
                    Preorder
                  </span>
                ) : null}
              </td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{customerText(order)}</td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{formatCurrency(order.total)}</td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{order.paymentMethod || "-"}</td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>
                <StatusBadge value={order.paymentStatus} palette={PAYMENT_STATUS_BADGES} />
              </td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>
                <StatusBadge value={order.orderStatus} palette={ORDER_STATUS_BADGES} />
              </td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{formatDate(order.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default AdminOrdersPage;
