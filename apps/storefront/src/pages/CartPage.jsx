import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../features/cart/CartContext";

const CartPage = () => {
  const { cart, loading, error, refreshCart, updateItem, removeItem, clear } = useCart();

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <section>
      <h2>Cart</h2>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      <ul>
        {cart.items.map((item) => (
          <li key={item.product} style={{ marginBottom: 8 }}>
            <div>
              {item.productSnapshot?.name || item.product} - qty: {item.quantity} - price:{" "}
              {item.unitPriceSnapshot}
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
              Remove
            </button>
          </li>
        ))}
      </ul>
      <p>Subtotal: {cart.subtotal || 0}</p>
      <button onClick={() => clear()} disabled={loading}>
        Clear Cart
      </button>
      {cart.items.length === 0 ? (
        <button type="button" disabled style={{ marginLeft: 8 }}>
          Proceed to checkout
        </button>
      ) : (
        <Link
          to="/checkout"
          style={{
            marginLeft: 8,
            display: "inline-block",
            padding: "2px 8px",
            border: "1px solid #333",
            borderRadius: 2,
            color: "inherit",
            textDecoration: "none"
          }}
        >
          Proceed to checkout
        </Link>
      )}
    </section>
  );
};

export default CartPage;
