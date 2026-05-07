import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteProduct, getAdminProducts, setProductFrozen } from "../services/productService";
import { useToast } from "../features/toast/ToastContext";

const formatCurrency = (value) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2
  }).format(value);
};

const pickLocalizedName = (name) => {
  if (!name) return "-";
  if (typeof name === "string") return name;
  return name.en || name.he || name.ar || "-";
};

const getProductState = (product) => {
  if (product.isDeleted) return "deleted";
  if (product.isFrozen) return "frozen";
  if (product.isActive) return "active";
  return "inactive";
};

const AdminProductsPage = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminProducts();
      setItems(data);
    } catch (err) {
      setError(err.userMessage || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((product) => {
      const status = getProductState(product);
      if (statusFilter !== "all" && status !== statusFilter) return false;

      if (!q) return true;
      const name = pickLocalizedName(product.name).toLowerCase();
      const sku = String(product.sku || "").toLowerCase();
      return name.includes(q) || sku.includes(q);
    });
  }, [items, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage]);

  if (loading) return <p>Loading products...</p>;

  if (error) {
    return (
      <section>
        <p style={{ color: "crimson" }}>{error}</p>
        <button type="button" onClick={load}>
          Retry
        </button>
      </section>
    );
  }

  const handleToggleFreeze = async (product) => {
    setActionError("");
    setBusyId(product._id);
    try {
      await setProductFrozen(product._id, !product.isFrozen);
      showToast(product.isFrozen ? "Product unfrozen." : "Product frozen.");
      await load();
    } catch (err) {
      const message = err.userMessage || "Failed to update product state";
      setActionError(message);
      showToast(message, "error");
    } finally {
      setBusyId("");
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`Delete "${pickLocalizedName(product.name)}"?`);
    if (!confirmed) return;

    setActionError("");
    setBusyId(product._id);
    try {
      await deleteProduct(product._id);
      showToast("Product deleted.");
      await load();
    } catch (err) {
      const message = err.userMessage || "Failed to delete product";
      setActionError(message);
      showToast(message, "error");
    } finally {
      setBusyId("");
    }
  };

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Products</h1>
        <Link to="/products/new">Create product</Link>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <label>
          Search
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or SKU"
            style={{ marginInlineStart: 8 }}
          />
        </label>
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{ marginInlineStart: 8 }}
          >
            <option value="all">all</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="frozen">frozen</option>
            <option value="deleted">deleted</option>
          </select>
        </label>
      </div>
      {actionError ? <p style={{ color: "crimson" }}>{actionError}</p> : null}
      <p style={{ color: "#666", marginTop: 0 }}>
        Showing {pagedItems.length} of {filteredItems.length} matching products.
      </p>
      {!filteredItems.length ? (
        <p>No matching products found.</p>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
                  Name
                </th>
                <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
                  SKU
                </th>
                <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
                  Price
                </th>
                <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
                  Stock
                </th>
                <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
                  Status
                </th>
                <th align="left" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 6px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((product) => (
                <tr key={product._id}>
                  <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>
                    {pickLocalizedName(product.name)}
                  </td>
                  <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{product.sku || "-"}</td>
                  <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>
                    {formatCurrency(product.salePrice ?? product.price)}
                  </td>
                  <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>
                    {product.stockStatus || "-"}
                  </td>
                  <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{getProductState(product)}</td>
                  <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>
                    <Link to={`/products/${product._id}/edit`}>Edit</Link>
                    <button
                      type="button"
                      onClick={() => handleToggleFreeze(product)}
                      disabled={busyId === product._id || product.isDeleted}
                      style={{ marginLeft: 8 }}
                    >
                      {product.isFrozen ? "Unfreeze" : "Freeze"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      disabled={busyId === product._id || product.isDeleted}
                      style={{ marginLeft: 8 }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1}
            >
              Previous
            </button>
            <span>
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default AdminProductsPage;
