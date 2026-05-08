import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "../features/cart/CartContext";
import { formatPrice } from "../utils/formatPrice";

const CartPage = () => {
  const { cart, loading, error, refreshCart, updateItem, setWrap, removeItem, clear } = useCart();
  const { t, i18n } = useTranslation(["cart", "common"]);
  const lang = (i18n.language || "he").split("-")[0];

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Cart-level wrap rate. Falls back to a sensible default when the cart is
  // empty (server hasn't told us the rate yet).
  const wrapPricePerKg = Number(cart.wrapPricePerKg) || 2;
  const wrapTotal = Number(cart.wrapTotal) || 0;
  const subtotal = Number(cart.subtotal) || 0;
  const grandTotal = subtotal + wrapTotal;
  const anyWrapAvailable = cart.items.some((item) => item.productSnapshot?.wrapAvailable);

  return (
    <section>
      <h2>{t("cart:title")}</h2>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      {cart.items.length === 0 ? <p>{t("cart:empty")}</p> : null}

      {anyWrapAvailable ? (
        <div
          style={{
            border: "1px solid #bbf7d0",
            background: "#f0fdf4",
            color: "#166534",
            padding: "10px 14px",
            borderRadius: 8,
            margin: "12px 0",
            fontSize: "0.9rem",
            lineHeight: 1.45
          }}
          role="note"
        >
          <strong style={{ display: "block", marginBottom: 4 }}>
            {t("cart:wrap.sectionTitle")}
          </strong>
          <span style={{ display: "block", marginBottom: 4 }}>
            {t("cart:wrap.explanation")}
          </span>
          <small>{t("cart:wrap.priceHint", { price: wrapPricePerKg })}</small>
        </div>
      ) : null}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {cart.items.map((item) => {
          const lineTotal = item.quantity * item.unitPriceSnapshot;
          const wrapAvailable = Boolean(item.productSnapshot?.wrapAvailable);
          const wrapFee = Number(item.wrapFee) || 0;
          return (
            <li
              key={item.product}
              style={{
                marginBottom: 10,
                padding: "10px 0",
                borderBottom: "1px solid #eee",
                display: "grid",
                gap: 6
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>
                  <strong>{item.productSnapshot?.name || item.product}</strong>
                  {" — "}
                  {t("cart:quantity")}: {item.quantity} × {formatPrice(item.unitPriceSnapshot, lang)}
                </span>
                <span>{formatPrice(lineTotal, lang)}</span>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button onClick={() => updateItem(item.product, item.quantity + 1)} disabled={loading}>
                  +
                </button>
                <button
                  onClick={() => updateItem(item.product, Math.max(item.quantity - 1, 1))}
                  disabled={loading}
                >
                  -
                </button>
                <button onClick={() => removeItem(item.product)} disabled={loading}>
                  {t("cart:remove")}
                </button>
              </div>

              {wrapAvailable ? (
                <label
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    fontSize: "0.9rem",
                    color: "#166534"
                  }}
                  title={t("cart:wrap.explanation")}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(item.wrap)}
                    disabled={loading}
                    onChange={(event) => setWrap(item.product, event.target.checked)}
                  />
                  <span>
                    {t("cart:wrap.toggleLabel")}{" "}
                    <small style={{ color: "#4b5563" }}>
                      ({t("cart:wrap.priceHint", { price: wrapPricePerKg })})
                    </small>
                  </span>
                  {item.wrap ? (
                    <span style={{ marginInlineStart: "auto", color: "#166534" }}>
                      {t("cart:wrap.lineFee", { amount: formatPrice(wrapFee, lang) })}
                    </span>
                  ) : null}
                </label>
              ) : null}
            </li>
          );
        })}
      </ul>

      {cart.items.length > 0 ? (
        <div style={{ marginTop: 12, display: "grid", gap: 4 }}>
          <p style={{ margin: 0 }}>
            {t("cart:subtotal")}: {formatPrice(subtotal, lang)}
          </p>
          {wrapTotal > 0 ? (
            <p style={{ margin: 0 }}>
              {t("cart:wrap.summaryLabel")}: {formatPrice(wrapTotal, lang)}
            </p>
          ) : null}
        </div>
      ) : null}

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => clear()} disabled={loading || cart.items.length === 0}>
          {t("cart:clearCart")}
        </button>
        {cart.items.length === 0 ? (
          <button type="button" disabled>
            {t("cart:proceedToCheckout")}
          </button>
        ) : (
          <Link
            to="/checkout"
            style={{
              display: "inline-block",
              padding: "2px 8px",
              border: "1px solid #333",
              borderRadius: 2,
              color: "inherit",
              textDecoration: "none"
            }}
          >
            {t("cart:proceedToCheckout")}
            {grandTotal > 0 ? <> ({formatPrice(grandTotal, lang)})</> : null}
          </Link>
        )}
      </div>
    </section>
  );
};

export default CartPage;
