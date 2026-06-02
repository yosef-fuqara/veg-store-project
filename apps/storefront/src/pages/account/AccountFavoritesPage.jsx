import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";
import { useCart } from "../../features/cart/CartContext";
import ProductCard from "../../components/ProductCard";
import { accountCardStyle, accountColors, accountPrimaryButtonStyle } from "../../features/account/accountTheme";
import * as accountService from "../../services/accountService";

const AccountFavoritesPage = () => {
  const { t, i18n } = useTranslation("account");
  const { updateUser } = useAuth();
  const { addItem } = useCart();
  const lang = (i18n.language || "he").split("-")[0];
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await accountService.getFavoriteProducts();
      setProducts(Array.isArray(list) ? list : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (productId) => {
    try {
      const next = await accountService.removeFavorite(productId);
      updateUser(next);
      setProducts((prev) => prev.filter((p) => String(p._id) !== String(productId)));
    } catch {
      /* ignore */
    }
  };

  const handleQuickAdd = async (product) => {
    const ok = await addItem(String(product._id), 1);
    if (ok) setStatus(t("favorites.added"));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 700, color: accountColors.textPrimary }}>{t("favorites.title")}</h2>
        <p style={{ margin: 0, fontSize: "15px", color: accountColors.textSecondary }}>{t("favorites.subtitle")}</p>
      </div>

      {status ? (
        <div role="status" style={{ padding: "12px 16px", borderRadius: "10px", background: accountColors.primarySurface, border: `1px solid ${accountColors.primaryBorder}`, color: accountColors.primary, fontSize: "14px" }}>
          {status}
        </div>
      ) : null}

      {loading ? (
        <div style={{ ...accountCardStyle, minHeight: "120px" }} aria-busy="true" />
      ) : products.length === 0 ? (
        <div style={{ ...accountCardStyle, textAlign: "center", padding: "32px 20px" }}>
          <p style={{ margin: "0 0 16px", color: accountColors.textSecondary }}>{t("favorites.empty")}</p>
          <Link to="/" style={accountPrimaryButtonStyle}>
            {t("favorites.browse")}
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
          {products.map((product) => (
            <div key={product._id} style={{ position: "relative" }}>
              <ProductCard product={product} lang={lang} compact />
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => handleQuickAdd(product)} style={{ ...accountPrimaryButtonStyle, flex: 1, padding: "8px 12px", fontSize: "13px", minWidth: "120px" }}>
                  {t("favorites.addToCart")}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(product._id)}
                  style={{
                    ...accountPrimaryButtonStyle,
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "13px",
                    minWidth: "100px",
                    background: "transparent",
                    color: accountColors.error,
                    border: `1.5px solid ${accountColors.errorBorder}`,
                    boxShadow: "none"
                  }}
                >
                  {t("favorites.remove")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountFavoritesPage;
