import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminOrders } from "../services/orderService";

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

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch (err) {
      setError(err.userMessage || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

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

  if (!orders.length) return <p>No orders found.</p>;

  return (
    <section>
      <h1>Orders</h1>
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
              </td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{customerText(order)}</td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{formatCurrency(order.total)}</td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{order.paymentMethod || "-"}</td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{order.paymentStatus || "-"}</td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{order.orderStatus || "-"}</td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{formatDate(order.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default AdminOrdersPage;
