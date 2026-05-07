import { useTranslation } from "react-i18next";
import { useCart } from "../features/cart/CartContext";
import { formatPrice } from "../utils/formatPrice";
import { getLocalizedProductName } from "../utils/localizedProduct";

const UNIT_KEYS = {
  kg: "units.kg",
  gram: "units.gram",
  unit: "units.unit",
  box: "units.box"
};

/**
 * @param {{ product: Record<string, unknown>, lang: string }} props
 */
const ProductCard = ({ product, lang }) => {
  const { t } = useTranslation("home");
  const { addItem, loading } = useCart();

  const id = product._id;
  const name = getLocalizedProductName(product, lang);
  const imageUrl = typeof product.imageUrl === "string" ? product.imageUrl : "";
  const unit = typeof product.unit === "string" ? product.unit : "";
  const unitLabelKey = UNIT_KEYS[unit] || unit;
  const unitLabel = UNIT_KEYS[unit] ? t(unitLabelKey) : unit;

  const price = Number(product.price);
  const salePrice =
    product.salePrice != null && product.salePrice !== "" ? Number(product.salePrice) : null;
  const hasSale =
    salePrice != null && !Number.isNaN(salePrice) && !Number.isNaN(price) && salePrice < price;
  const displayPrice = hasSale ? salePrice : price;

  const stockStatus = product.stockStatus;
  const inStock = stockStatus === "in_stock";

  const handleAdd = () => {
    if (!id || !inStock) return;
    addItem(String(id), 1);
  };

  return (
    <article
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
      }}
    >
      <div
        style={{
          aspectRatio: "4 / 3",
          background: "#f5f5f5",
          overflow: "hidden"
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              fontSize: "0.85rem"
            }}
          >
            —
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: "1.05rem", lineHeight: 1.3 }}>{name || "—"}</h3>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#555" }}>
          {hasSale ? (
            <>
              <span style={{ textDecoration: "line-through", marginInlineEnd: 8, color: "#888" }}>
                {formatPrice(price, lang)}
              </span>
              <strong>{formatPrice(displayPrice, lang)}</strong>
            </>
          ) : (
            <strong>{formatPrice(displayPrice, lang)}</strong>
          )}
          {unitLabel ? (
            <span style={{ marginInlineStart: 6, fontWeight: "normal" }}>/ {unitLabel}</span>
          ) : null}
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem" }}>
          {inStock ? (
            <span style={{ color: "#1b5e20" }}>✓</span>
          ) : (
            <span style={{ color: "#c62828", fontWeight: 600 }}>{t("outOfStock")}</span>
          )}
        </p>
        <button
          type="button"
          onClick={handleAdd}
          disabled={loading || !inStock || !id}
          style={{
            marginTop: "auto",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #2e7d32",
            background: inStock ? "#2e7d32" : "#ccc",
            color: "#fff",
            cursor: inStock && !loading ? "pointer" : "not-allowed",
            fontWeight: 600
          }}
        >
          {t("addToCart")}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
