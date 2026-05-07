import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "../features/cart/CartContext";
import { formatPrice } from "../utils/formatPrice";

const CartPage = () => {
  const { cart, loading, error, refreshCart, updateItem, removeItem, clear } = useCart();
  const { t, i18n } = useTranslation(["cart", "common"]);
  const lang = (i18n.language || "he").split("-")[0];

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <section>
      <h2>{t("cart:title")}</h2>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      {cart.items.length === 0 ? <p>{t("cart:empty")}</p> : null}
      <ul>
        {cart.items.map((item) => (
          <li key={item.product} style={{ marginBottom: 8 }}>
            <div>
              {item.productSnapshot?.name || item.product} - {t("cart:quantity")}: {item.quantity} -{" "}
              {t("cart:price")}: {formatPrice(item.unitPriceSnapshot, lang)}
            </div>
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
          </li>
        ))}
      </ul>
      <p>
        {t("cart:subtotal")}: {formatPrice(cart.subtotal || 0, lang)}
      </p>
      <button onClick={() => clear()} disabled={loading}>
        {t("cart:clearCart")}
      </button>
      {cart.items.length === 0 ? (
        <button type="button" disabled style={{ marginInlineStart: 8 }}>
          {t("cart:proceedToCheckout")}
        </button>
      ) : (
        <Link
          to="/checkout"
          style={{
            marginInlineStart: 8,
            display: "inline-block",
            padding: "2px 8px",
            border: "1px solid #333",
            borderRadius: 2,
            color: "inherit",
            textDecoration: "none"
          }}
        >
          {t("cart:proceedToCheckout")}
        </Link>
      )}
    </section>
  );
};

export default CartPage;
