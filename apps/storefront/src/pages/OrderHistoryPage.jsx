import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import * as orderService from "../services/orderService";
import { formatChargedTotal, formatPrice } from "../utils/formatPrice";
import { formatQtyDisplay, formatApproxWeightQuantity } from "../utils/cartLineQuantity";
import { formatOrderDeliveryAreaLabel } from "../utils/deliveryAreaDisplay";
import { getLocalizedText } from "../utils/localizedProduct";

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
  maxWidth: '960px',
  margin: '0 auto',
  padding: '40px 24px',
};

const cardStyle = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: '14px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
};

const badgeTone = (status) => {
  if (["confirmed", "delivered", "paid", "bank_transfer_approved"].includes(status)) {
    return { background: colors.successSurface, color: colors.success, border: colors.successBorder };
  }
  if (["cancelled", "failed"].includes(status)) {
    return { background: colors.errorSurface, color: colors.error, border: colors.errorBorder };
  }
  if (["pending_payment", "bank_transfer_pending", "sent_with_delivery_company"].includes(status)) {
    return { background: colors.warningSurface, color: colors.warning, border: colors.warningBorder };
  }
  return { background: colors.primarySurface, color: colors.primary, border: colors.primaryBorder };
};

const statusBadgeStyle = (status) => {
  const tone = badgeTone(status);
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 10px',
    borderRadius: '9999px',
    background: tone.background,
    color: tone.color,
    border: `1px solid ${tone.border}`,
    fontSize: '12px',
    fontWeight: 600,
  };
};

const SkeletonLine = ({ width = '100%', height = 16 }) => (
  <motion.div
    animate={{ opacity: [0.4, 0.8, 0.4] }}
    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
    style={{ width, height, background: colors.border, borderRadius: '6px' }}
  />
);

const formatDate = (value, lang) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(lang === "he" ? "he-IL" : lang === "ar" ? "ar" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
};

const addressText = (address) => {
  if (!address) return "—";
  return [
    address.label,
    address.city,
    address.street,
    address.building,
    address.apartment,
    address.notes,
  ].filter(Boolean).join(", ") || "—";
};

const OrderHistoryPage = () => {
  const { t, i18n } = useTranslation(["order", "cart", "home"]);
  const { t: tCheckout } = useTranslation("checkout");
  const lang = (i18n.language || "he").split("-")[0];
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await orderService.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setOrders([]);
      setError(err.userMessage || t("history.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section style={pageStyle}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: '30px', lineHeight: '36px', fontWeight: 700, color: colors.textPrimary }}>
            {t("history.title")}
          </h1>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: '24px', color: colors.textSecondary }}>
            {t("history.subtitle")}
          </p>
        </div>

        {error && (
          <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorSurface, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <SkeletonLine width="48%" height={24} />
            <SkeletonLine width="70%" />
            <SkeletonLine width="55%" />
            <SkeletonLine width="85%" />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', lineHeight: '28px', color: colors.textPrimary }}>
              {t("history.emptyTitle")}
            </h2>
            <p style={{ margin: '0 0 20px', color: colors.textSecondary, fontSize: '15px', lineHeight: '24px' }}>
              {t("history.emptyText")}
            </p>
            <Link
              to="/"
              style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 24px', borderRadius: '10px', background: colors.primary, color: colors.textInverse, fontSize: '15px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 14px rgba(30,107,60,0.30)' }}
            >
              {t("continueShopping")}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((order) => (
              <motion.article
                key={order._id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={cardStyle}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ margin: '0 0 6px', fontSize: '18px', lineHeight: '28px', color: colors.textPrimary }}>
                      {t("history.orderNumber", { id: String(order._id || "").slice(-6).toUpperCase() })}
                    </h2>
                    <div style={{ fontSize: '14px', color: colors.textSecondary }}>
                      {t("history.createdAt")}: {formatDate(order.createdAt, lang)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <span style={statusBadgeStyle(order.orderStatus)}>
                      {t(`orderStatus.${order.orderStatus}`, { defaultValue: order.orderStatus })}
                    </span>
                    <span style={statusBadgeStyle(order.paymentStatus)}>
                      {t(`paymentStatus.${order.paymentStatus}`, { defaultValue: order.paymentStatus })}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', borderRadius: '10px', background: colors.surfaceRaised }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted, marginBottom: '4px' }}>{t("delivery")}</div>
                    <div style={{ fontSize: '14px', color: colors.textPrimary }}>{formatOrderDeliveryAreaLabel(order, tCheckout, lang)}</div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>{addressText(order.deliveryAddress)}</div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '10px', background: colors.surfaceRaised }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted, marginBottom: '4px' }}>{t("paymentMethod")}</div>
                    <div style={{ fontSize: '14px', color: colors.textPrimary }}>
                      {t(`paymentMethods.${order.paymentMethod}`, { defaultValue: order.paymentMethod })}
                    </div>
                    {order.preferredDeliveryAt && (
                      <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                        {t("preferredAt")}: {formatDate(order.preferredDeliveryAt, lang)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: '8px 0', marginBottom: '12px' }}>
                  {(order.items || []).map((item, index) => {
                    const lineDisplay =
                      typeof item.lineTotal === "number"
                        ? item.lineTotal
                        : Number(item.price) * Number(item.quantity);
                    return (
                      <div key={`${item.product}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '8px 0' }}>
                        <span style={{ fontSize: '14px', color: colors.textPrimary }}>
                          {getLocalizedText(item.name, lang)}
                          {item.purchaseMode === "amount" && item.requestedAmountIls != null ? (
                            <>
                              {" · "}
                              {item.unit === "kg" || item.unit === "gram" ? (
                                t("cart:purchaseByAmountLineDetail", {
                                  unitPrice: formatPrice(item.price, lang),
                                  unitLabel: t(`home:units.${item.unit}`),
                                  weight: formatApproxWeightQuantity(item.quantity, item.unit)
                                })
                              ) : (
                                t("cart:purchaseByAmountNote", {
                                  amount: formatPrice(item.requestedAmountIls, lang)
                                })
                              )}
                            </>
                          ) : (
                            <> × {formatQtyDisplay(item.quantity)}</>
                          )}
                          {item.wrap && (
                            <span style={{ marginInlineStart: '6px', padding: '1px 6px', borderRadius: '9999px', fontSize: '11px', background: colors.successSurface, color: colors.success, border: `1px solid ${colors.successBorder}` }}>
                              {t("wrapBadge")}{Number(item.wrapFee) > 0 ? ` (+${formatPrice(item.wrapFee, lang)})` : ""}
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, flexShrink: 0 }}>
                          {formatPrice(lineDisplay, lang)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {(order.notes || order.customRequest) && (
                  <div style={{ marginBottom: '12px', fontSize: '14px', color: colors.textSecondary, lineHeight: 1.5 }}>
                    {order.customRequest && <div><strong>{t("customRequest")}:</strong> {order.customRequest}</div>}
                    {order.notes && <div><strong>{t("yourNotes")}:</strong> {order.notes}</div>}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Link to={`/orders/${order._id}`} style={{ color: colors.primary, fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                    {t("history.viewDetails")}
                  </Link>
                  <div style={{ fontSize: '18px', lineHeight: '28px', fontWeight: 700, color: colors.textPrimary }}>
                    {t("total")}: {formatChargedTotal(order.total, lang)}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default OrderHistoryPage;
