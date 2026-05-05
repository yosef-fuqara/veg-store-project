import { useState } from "react";
import { useCart } from "../features/cart/CartContext";

const HomePage = () => {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { addItem, loading, error } = useCart();

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!productId) return;
    await addItem(productId, Number(quantity));
  };

  return (
    <section>
      <h1>Storefront</h1>
      <p>Use a real product id to add an item to cart.</p>
      <form onSubmit={handleAdd} style={{ display: "grid", maxWidth: 420, gap: 8 }}>
        <input
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Product ID"
        />
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          Add To Cart
        </button>
      </form>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </section>
  );
};

export default HomePage;
