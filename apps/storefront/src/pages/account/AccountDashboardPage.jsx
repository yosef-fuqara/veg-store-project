import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight, Heart, MapPin, Package } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { accountCardStyle, accountColors, accountPrimaryButtonStyle } from "../../features/account/accountTheme";
import * as orderService from "../../services/orderService";
import { formatChargedTotal } from "../../utils/formatPrice";
import { reorderFromOrder } from "../../utils/reorderFromOrder";
import { useCart } from "../../features/cart/CartContext";

const formatDate = (value, lang) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(lang === "he" ? "he-IL" : lang === "ar" ? "ar" : "en-US", {
      dateStyle: "medium"
    }).format(new Date(value));
  } catch {
    return String(value);
  }
};

const quickLinkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "14px 16px",
  borderRadius: "12px",
  border: `1px solid ${accountColors.border}`,
  background: accountColors.surface,
  textDecoration: "none",
  color: accountColors.textPrimary,
  fontSize: "15px",
  fontWeight: 500,
  transition: "border-color 0.15s, background 0.15s"
};

const AccountDashboardPage = () => {
  const { t, i18n } = useTranslation(["account", "order"]);
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const lang = (i18n.language || "he").split("-")[0];
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reorderMsg, setReorderMsg] = useState("");
  const [reorderingId, setReorderingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await orderService.getOrders();
        if (!cancelled) setOrders(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReorder = useCallback(
    async (order) => {
      setReorderMsg("");
      setReorderingId(order._id);
      try {
        const { added, skipped } = await reorderFromOrder(order);
        await refreshCart?.();
        if (added === 0) {
          setReorderMsg(t("account:dashboard.reorderFailed"));
        } else if (skipped > 0) {
          setReorderMsg(t("account:dashboard.reorderPartial", { added, skipped }));
        } else {
          setReorderMsg(t("account:dashboard.reorderSuccess", { count: added }));
        }
      } catch {
        setReorderMsg(t("account:dashboard.reorderFailed"));
      } finally {
        setReorderingId(null);
      }
    },
    [refreshCart, t]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={accountCardStyle}>
        <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700, color: accountColors.textPrimary }}>
          {t("account:dashboard.welcome", { name: user?.name || "" })}
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: accountColors.textSecondary }}>{user?.email}</p>
      </div>

      {reorderMsg ? (
        <div
          role="status"
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: accountColors.primarySurface,
            border: `1px solid ${accountColors.primaryBorder}`,
            color: accountColors.primary,
            fontSize: "14px"
          }}
        >
          {reorderMsg}
        </div>
      ) : null}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "12px", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: accountColors.textPrimary }}>
            {t("account:dashboard.recentOrders")}
          </h3>
          <Link to="/account/orders" style={{ fontSize: "14px", fontWeight: 600, color: accountColors.primary, textDecoration: "none" }}>
            {t("account:dashboard.viewAllOrders")}
          </Link>
        </div>

        {loading ? (
          <div style={{ ...accountCardStyle, minHeight: "80px" }} aria-busy="true" />
        ) : orders.length === 0 ? (
          <div style={{ ...accountCardStyle, color: accountColors.textSecondary, fontSize: "15px" }}>
            {t("account:dashboard.noOrders")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {orders.map((order) => (
              <motion.article
                key={order._id}
                style={{ ...accountCardStyle, padding: "18px 20px" }}
                whileHover={{ y: -1 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "16px", color: accountColors.textPrimary }}>
                      {t("order:history.orderNumber", { id: String(order._id || "").slice(-6).toUpperCase() })}
                    </div>
                    <div style={{ fontSize: "13px", color: accountColors.textSecondary, marginTop: "4px" }}>
                      {t("account:dashboard.orderDate", { date: formatDate(order.createdAt, lang) })}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: accountColors.textPrimary }}>
                    {formatChargedTotal(order.total, lang)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link
                    to={`/orders/${order._id}`}
                    style={{ ...accountPrimaryButtonStyle, padding: "8px 14px", fontSize: "13px", boxShadow: "none" }}
                  >
                    {t("account:dashboard.viewOrder")}
                  </Link>
                  <button
                    type="button"
                    disabled={reorderingId === order._id}
                    onClick={() => handleReorder(order)}
                    style={{
                      ...accountPrimaryButtonStyle,
                      padding: "8px 14px",
                      fontSize: "13px",
                      background: "transparent",
                      color: accountColors.primary,
                      border: `1.5px solid ${accountColors.primary}`,
                      boxShadow: "none",
                      opacity: reorderingId === order._id ? 0.6 : 1
                    }}
                  >
                    {t("account:dashboard.reorder")}
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 600, color: accountColors.textPrimary }}>
          {t("account:dashboard.quickLinks")}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
          <Link to="/account/orders" style={quickLinkStyle}>
            <Package size={20} color={accountColors.primary} aria-hidden />
            {t("account:dashboard.linkOrders")}
            <ArrowRight size={16} style={{ marginInlineStart: "auto" }} aria-hidden />
          </Link>
          <Link to="/account/favorites" style={quickLinkStyle}>
            <Heart size={20} color={accountColors.primary} aria-hidden />
            {t("account:dashboard.linkFavorites")}
            <ArrowRight size={16} style={{ marginInlineStart: "auto" }} aria-hidden />
          </Link>
          <Link to="/account/addresses" style={quickLinkStyle}>
            <MapPin size={20} color={accountColors.primary} aria-hidden />
            {t("account:dashboard.linkAddresses")}
            <ArrowRight size={16} style={{ marginInlineStart: "auto" }} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountDashboardPage;
