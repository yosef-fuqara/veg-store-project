import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { getAdminCategories, softDeleteCategory } from "../services/categoryService";
import { getAdminProducts } from "../services/productService";
import { useToast } from "../features/toast/ToastContext";
import { pickLocalizedName } from "../utils/localizedDisplayName";

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
  textInverse: "#ffffff",
  error: "#991b1b",
  errorBg: "#fef2f2",
  errorBorder: "#fecaca",
};

const STATUS_STYLES = {
  active: { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
  inactive: { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
  frozen: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  removed: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
};

const Pill = ({ bg, color, border, children }) => (
  <span
    style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: "9999px",
      background: bg,
      color,
      border: `1px solid ${border}`,
      fontSize: "12px",
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const interactiveBtn = {
  transition: "background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s",
};

function categoryRowStatus(cat) {
  if (cat.isDeleted) return "removed";
  if (cat.isFrozen) return "frozen";
  if (cat.isActive) return "active";
  return "inactive";
}

function productCategoryId(product) {
  const c = product.category;
  if (!c) return null;
  if (typeof c === "object" && c._id != null) return String(c._id);
  return String(c);
}

const AdminCategoriesPage = () => {
  const { t } = useTranslation(["categories", "common"]);
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const cancelRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cats, prods] = await Promise.all([getAdminCategories(), getAdminProducts()]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      setError(err.userMessage || t("categories:list.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const productCountByCategoryId = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const cid = productCategoryId(p);
      if (!cid) continue;
      map.set(cid, (map.get(cid) || 0) + 1);
    }
    return map;
  }, [products]);

  useEffect(() => {
    if (!pendingDelete) return undefined;
    const t = requestAnimationFrame(() => cancelRef.current?.focus());
    const onKey = (e) => {
      if (e.key === "Escape") setPendingDelete(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [pendingDelete]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await softDeleteCategory(pendingDelete._id);
      showToast(t("categories:list.toasts.removed"));
      setPendingDelete(null);
      await load();
    } catch (err) {
      showToast(err.userMessage || t("categories:list.toasts.removeFailed"), "error");
    } finally {
      setDeleting(false);
    }
  };

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => String(a.slug).localeCompare(String(b.slug))),
    [categories]
  );

  return (
    <div style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <style>{`
        @keyframes adminCategoriesSkeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .admin-categories-skel { animation: adminCategoriesSkeletonPulse 1.4s ease-in-out infinite; }
        .admin-categories-add:focus-visible,
        .admin-categories-manage-products:focus-visible,
        .admin-categories-delete:focus-visible,
        .admin-categories-retry:focus-visible,
        .admin-categories-modal-cancel:focus-visible,
        .admin-categories-modal-confirm:focus-visible {
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
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
          <Link
            to="/categories/new"
            className="admin-categories-add"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "10px",
              background: colors.primary,
              color: colors.textInverse,
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(30,107,60,0.30)",
              ...interactiveBtn,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.primaryHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.primary;
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t("categories:list.addCategory")}
          </Link>
          <Link
            to="/products"
            className="admin-categories-manage-products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              border: `1.5px solid ${colors.border}`,
              background: colors.surface,
              color: colors.textPrimary,
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              ...interactiveBtn,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.bg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.surface;
            }}
          >
            {t("categories:list.productsLink")}
          </Link>
        </div>
        <div style={{ textAlign: "end", flex: "1 1 200px", minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: "36px",
              fontWeight: 800,
              color: colors.textPrimary,
              letterSpacing: "-0.5px",
            }}
          >
            {t("categories:list.pageTitle")}
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: colors.textMuted, lineHeight: 1.5 }}>
            {t("categories:list.pageSubtitle")}
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
            className="admin-categories-retry"
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
            {t("common:retry")}
          </button>
        </div>
      )}

      <div
        style={{
          background: colors.surface,
          borderRadius: "14px",
          border: `1px solid ${colors.border}`,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          maxWidth: "100%",
        }}
      >
        {loading ? (
          <div style={{ padding: "8px 0 16px" }} aria-busy="true" aria-live="polite">
            <div
              style={{
                padding: "12px 20px 8px",
                fontSize: "12px",
                fontWeight: 600,
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {t("common:loadingDots")}
            </div>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", maxWidth: "100%" }}>
              <table style={{ width: "100%", minWidth: "640px", borderCollapse: "collapse" }}>
                <tbody>
                  {Array.from({ length: 5 }).map((_, r) => (
                    <tr key={r} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                      {Array.from({ length: 5 }).map((__, c) => (
                        <td key={c} style={{ padding: "14px 16px" }}>
                          <div
                            className="admin-categories-skel"
                            style={{
                              height: 14,
                              width: c === 0 ? "40%" : "60%",
                              maxWidth: "100%",
                              background: colors.borderLight,
                              borderRadius: "6px",
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : sortedCategories.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center", color: colors.textMuted }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: colors.textPrimary, marginBottom: "6px" }}>
              {t("categories:list.empty.title")}
            </div>
            <div style={{ fontSize: "13px", lineHeight: 1.5 }}>{t("categories:list.empty.subtitle")}</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", maxWidth: "100%" }}>
            <table style={{ width: "100%", minWidth: "720px", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    t("categories:list.tableHeaders.actions"),
                    t("categories:list.tableHeaders.products"),
                    t("categories:list.tableHeaders.status"),
                    t("categories:list.tableHeaders.slug"),
                    t("categories:list.tableHeaders.name")
                  ].map((h) => (
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
                {sortedCategories.map((cat) => {
                  const name = pickLocalizedName(cat.name);
                  const state = categoryRowStatus(cat);
                  const st = STATUS_STYLES[state];
                  const cid = String(cat._id);
                  const n = productCountByCategoryId.get(cid) ?? 0;
                  const canDelete = !cat.isDeleted;
                  return (
                    <tr key={cid} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                      <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                        {canDelete ? (
                          <button
                            type="button"
                            className="admin-categories-delete"
                            onClick={() => setPendingDelete(cat)}
                            style={{
                              padding: "8px 14px",
                              borderRadius: "8px",
                              border: `1px solid ${colors.errorBorder}`,
                              background: colors.errorBg,
                              color: colors.error,
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              ...interactiveBtn,
                            }}
                          >
                            {t("categories:list.deleteButton")}
                          </button>
                        ) : (
                          <span style={{ fontSize: "13px", color: colors.textMuted }}>—</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: "14px",
                          color: colors.textPrimary,
                          verticalAlign: "middle",
                        }}
                      >
                        {n}
                      </td>
                      <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                        <Pill bg={st.bg} color={st.color} border={st.border}>
                          {t(`categories:list.status.${state}`)}
                        </Pill>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: "13px",
                          color: colors.textSecondary,
                          fontFamily: "ui-monospace, monospace",
                          verticalAlign: "middle",
                        }}
                      >
                        {cat.slug}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: colors.textPrimary,
                          verticalAlign: "middle",
                        }}
                      >
                        {name || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingDelete && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(28, 25, 23, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            boxSizing: "border-box",
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPendingDelete(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-delete-category-title"
            style={{
              background: colors.surface,
              borderRadius: "14px",
              border: `1px solid ${colors.border}`,
              boxShadow: "0 16px 48px rgba(0,0,0,0.16)",
              maxWidth: "440px",
              width: "100%",
              padding: "24px",
              boxSizing: "border-box",
            }}
          >
            <h2
              id="admin-delete-category-title"
              style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 700, color: colors.textPrimary }}
            >
              {t("categories:list.modal.title")}
            </h2>
            <p style={{ margin: "0 0 12px", fontSize: "14px", color: colors.textSecondary, lineHeight: 1.55 }}>
              <Trans
                i18nKey="categories:list.modal.body"
                values={{ name: pickLocalizedName(pendingDelete.name) || pendingDelete.slug }}
                components={{ bold: <strong /> }}
              />
            </p>
            <p style={{ margin: "0 0 20px", fontSize: "14px", color: colors.textPrimary, lineHeight: 1.55 }}>
              {(() => {
                const count = productCountByCategoryId.get(String(pendingDelete._id)) ?? 0;
                if (count === 0) {
                  return t("categories:list.modal.noProducts");
                }
                return t("categories:list.modal.withProducts", { count });
              })()}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                ref={cancelRef}
                className="admin-categories-modal-cancel"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.textPrimary,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: deleting ? "default" : "pointer",
                  opacity: deleting ? 0.7 : 1,
                  ...interactiveBtn,
                }}
              >
                {t("common:cancel")}
              </button>
              <button
                type="button"
                className="admin-categories-modal-confirm"
                disabled={deleting}
                onClick={handleConfirmDelete}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: `1px solid ${colors.errorBorder}`,
                  background: colors.error,
                  color: colors.textInverse,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: deleting ? "wait" : "pointer",
                  opacity: deleting ? 0.85 : 1,
                  ...interactiveBtn,
                }}
              >
                {deleting ? t("categories:list.modal.removing") : t("categories:list.modal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
