import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminOrders } from "../services/orderService";

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  bg: "#faf8f5",
  surface: "#ffffff",
  border: "#e8e3dc",
  borderLight: "#f0ece6",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  error: "#991b1b",
  errorBg: "#fef2f2",
  errorBorder: "#fecaca",
};

const ORDER_STATUS_STYLES = {
  new: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  confirmed: { bg: "#ecfeff", color: "#0e7490", border: "#a5f3fc" },
  preparing: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  ready_for_delivery: { bg: "#ecfccb", color: "#3f6212", border: "#bef264" },
  sent_with_delivery_company: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  delivered: { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
  cancelled: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
};

const CANCELLED = "cancelled";

/** Local calendar day start (00:00:00.000). */
function startOfLocalDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** ISO-style week: Monday 00:00 local. */
function startOfLocalWeekMonday(d) {
  const x = startOfLocalDay(d);
  const day = x.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + offset);
  return x;
}

function startOfLocalMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function orderCreatedAt(order) {
  const raw = order?.createdAt;
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}

function isValidSalesOrder(order) {
  return order?.orderStatus !== CANCELLED;
}

function sumTotals(orders) {
  return orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
}

const Pill = ({ value }) => {
  const s = ORDER_STATUS_STYLES[value] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
  const label = String(value || "—").replaceAll("_", " ");
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "9999px",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: "11px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        textTransform: "capitalize",
      }}
    >
      {label}
    </span>
  );
};

const formatCurrency = (v) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 2 }).format(v);

const formatDateTime = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleString("en-IL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const customerName = (order) => {
  const u = order?.user;
  if (!u) return "—";
  return u.name || u.email || "—";
};

const customerPhone = (order) => {
  if (order?.customerPhone) return order.customerPhone;
  return order?.user?.phone || "—";
};

const StatCard = ({ label, value, sublabel }) => (
  <div
    style={{
      background: colors.surface,
      borderRadius: "14px",
      border: `1px solid ${colors.border}`,
      padding: "20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      minWidth: 0,
    }}
  >
    <div style={{ fontSize: "12px", fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
      {label}
    </div>
    <div style={{ fontSize: "26px", fontWeight: 800, color: colors.textPrimary, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
      {value}
    </div>
    {sublabel && (
      <div style={{ marginTop: "8px", fontSize: "12px", color: colors.textSecondary, lineHeight: 1.4 }}>
        {sublabel}
      </div>
    )}
  </div>
);

const interactiveBtn = {
  transition: "background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s",
};

const AdminSalesDashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await getAdminOrders({}));
    } catch (err) {
      setError(err.userMessage || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const now = useMemo(() => new Date(), [orders, loading]);

  const metrics = useMemo(() => {
    const valid = orders.filter(isValidSalesOrder);
    const dayStart = startOfLocalDay(now).getTime();
    const nextDay = dayStart + 86400000;
    const weekStart = startOfLocalWeekMonday(now).getTime();
    const nextWeek = weekStart + 7 * 86400000;
    const monthStart = startOfLocalMonth(now).getTime();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

    const inRange = (o, start, end) => {
      const t = orderCreatedAt(o);
      return t != null && t >= start && t < end;
    };

    const todayOrders = valid.filter((o) => inRange(o, dayStart, nextDay));
    const weekOrders = valid.filter((o) => inRange(o, weekStart, nextWeek));
    const monthOrders = valid.filter((o) => inRange(o, monthStart, nextMonth));

    return {
      todayTotal: sumTotals(todayOrders),
      todayCount: todayOrders.length,
      weekTotal: sumTotals(weekOrders),
      weekCount: weekOrders.length,
      monthTotal: sumTotals(monthOrders),
      monthCount: monthOrders.length,
      todayBuyers: [...todayOrders].sort((a, b) => (orderCreatedAt(b) || 0) - (orderCreatedAt(a) || 0)),
    };
  }, [orders, now]);

  return (
    <div style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <style>{`
        @keyframes adminSalesSkeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes adminSalesSpin {
          to { transform: rotate(360deg); }
        }
        .admin-sales-skel { animation: adminSalesSkeletonPulse 1.4s ease-in-out infinite; }
        .admin-sales-refresh:focus-visible,
        .admin-sales-retry:focus-visible {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <button
          type="button"
          className="admin-sales-refresh"
          onClick={load}
          disabled={loading}
          aria-label={loading ? "Refreshing sales data" : "Refresh sales data"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "10px",
            border: `1px solid ${colors.border}`,
            background: colors.surface,
            color: colors.textPrimary,
            fontSize: "13px",
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            ...interactiveBtn,
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = colors.bg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.surface;
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={loading ? { animation: "adminSalesSpin 0.9s linear infinite" } : undefined}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        <div style={{ textAlign: "end", flex: "1 1 200px", minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: "36px", fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.5px" }}>
            Sales
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: colors.textMuted, lineHeight: 1.5 }}>
            Totals exclude cancelled orders · Week starts Monday (local time)
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: colors.errorBg,
            border: `1px solid ${colors.errorBorder}`,
            color: colors.error,
            fontSize: "14px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ minWidth: 0 }}>{error}</span>
          <button
            type="button"
            onClick={load}
            className="admin-sales-retry"
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: "8px",
              border: `1px solid ${colors.errorBorder}`,
              background: "transparent",
              color: colors.error,
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              ...interactiveBtn,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }} aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="admin-sales-skel"
              style={{
                height: "112px",
                borderRadius: "14px",
                background: colors.borderLight,
                border: `1px solid ${colors.borderLight}`,
              }}
            />
          ))}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <StatCard label="Today · sales" value={formatCurrency(metrics.todayTotal)} />
            <StatCard label="Today · orders" value={String(metrics.todayCount)} />
            <StatCard label="This week · sales" value={formatCurrency(metrics.weekTotal)} />
            <StatCard label="This week · orders" value={String(metrics.weekCount)} />
            <StatCard label="This month · sales" value={formatCurrency(metrics.monthTotal)} />
            <StatCard label="This month · orders" value={String(metrics.monthCount)} />
          </div>

          <div
            style={{
              background: colors.surface,
              borderRadius: "14px",
              border: `1px solid ${colors.border}`,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ padding: "20px 20px 12px", borderBottom: `1px solid ${colors.borderLight}` }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: colors.textPrimary }}>Who bought today</h2>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: colors.textMuted, lineHeight: 1.5 }}>
                Non-cancelled orders placed since midnight (your local time)
              </p>
            </div>

            {metrics.todayBuyers.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: colors.textMuted, fontSize: "14px" }}>
                No qualifying orders yet today.
              </div>
            ) : (
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", maxWidth: "100%" }}>
                <table style={{ width: "100%", minWidth: "640px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Customer", "Phone", "Total", "Order time", "Status", "Actions"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 16px",
                            textAlign: "start",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: colors.textSecondary,
                            background: colors.bg,
                            borderBottom: `1px solid ${colors.border}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.todayBuyers.map((order) => (
                      <tr key={order._id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: colors.textPrimary, maxWidth: "220px" }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={customerName(order)}>
                            {customerName(order)}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: colors.textSecondary, whiteSpace: "nowrap" }}>
                          {customerPhone(order)}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 600, color: colors.textPrimary, fontVariantNumeric: "tabular-nums" }}>
                          {formatCurrency(Number(order.total) || 0)}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", color: colors.textSecondary, whiteSpace: "nowrap" }}>
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <Pill value={order.orderStatus} />
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <Link
                            to={`/orders/${order._id}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 14px",
                              borderRadius: "10px",
                              border: `1px solid ${colors.border}`,
                              background: colors.surface,
                              fontSize: "12px",
                              fontWeight: 500,
                              color: colors.textPrimary,
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                              ...interactiveBtn,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = colors.bg;
                              e.currentTarget.style.borderColor = colors.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = colors.surface;
                              e.currentTarget.style.borderColor = colors.border;
                            }}
                          >
                            View
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSalesDashboardPage;
