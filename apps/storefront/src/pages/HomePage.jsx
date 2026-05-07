import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ProductCard from "../components/ProductCard";
import { useCart } from "../features/cart/CartContext";
import * as productService from "../services/productService";
import { formatApiError } from "../utils/formatApiError";

const HomePage = () => {
  const { t, i18n } = useTranslation(["home", "common"]);
  const { error: cartError } = useCart();
  const lang = (i18n.language || "he").split("-")[0];

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await productService.getProducts();
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      setProducts([]);
      setError(err.userMessage || formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <section>
        <h1 style={{ marginTop: 0 }}>{t("home:title")}</h1>
        <p>{t("home:subtitle")}</p>
        <p>{t("home:loading")}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h1 style={{ marginTop: 0 }}>{t("home:title")}</h1>
        <p>{t("home:subtitle")}</p>
        <div
          role="alert"
          style={{
            padding: 16,
            borderRadius: 8,
            background: "#ffebee",
            color: "#b71c1c",
            marginBottom: 16
          }}
        >
          <strong>{t("home:errorTitle")}</strong>
          <p style={{ margin: "8px 0 0" }}>{error}</p>
          <button type="button" onClick={load} style={{ marginTop: 12 }}>
            {t("common:retry")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1 style={{ marginTop: 0 }}>{t("home:title")}</h1>
      <p>{t("home:subtitle")}</p>

      {products.length === 0 ? (
        <p style={{ color: "#666" }}>{t("home:empty")}</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
            marginTop: "1.25rem"
          }}
        >
          {products.map((product) => (
            <ProductCard key={product._id} product={product} lang={lang} />
          ))}
        </div>
      )}

      {cartError ? (
        <p style={{ color: "crimson", marginTop: 16 }} role="status">
          {cartError}
        </p>
      ) : null}
    </section>
  );
};

export default HomePage;
