import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAdminCategories } from "../services/categoryService";
import { createProduct, getAdminProducts, updateProduct } from "../services/productService";
import { useToast } from "../features/toast/ToastContext";

const UNIT_OPTIONS = ["kg", "gram", "unit", "box"];
const STOCK_OPTIONS = ["in_stock", "out_of_stock"];

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  salePrice: "",
  category: "",
  unit: "kg",
  stockStatus: "in_stock",
  isFeatured: false,
  isPreorderOnly: false,
  minAdvanceHours: 24,
  preparationNotes: ""
};

const ProductFormPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const productId = params.id;
  const isEditMode = Boolean(productId);

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [categories, setCategories] = useState([]);
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const title = useMemo(() => (isEditMode ? "Edit product" : "Create product"), [isEditMode]);

  const loadInitialData = useCallback(async () => {
    setInitializing(true);
    setError("");
    try {
      const [categoryList, products] = await Promise.all([getAdminCategories(), getAdminProducts()]);
      setCategories(categoryList.filter((cat) => !cat.isDeleted));

      if (isEditMode) {
        const current = products.find((item) => item._id === productId);
        if (!current) {
          throw new Error("Product not found");
        }
        setForm({
          name: current.name || "",
          description: current.description || "",
          price: current.price ?? "",
          salePrice: current.salePrice ?? "",
          category: current.category?._id || "",
          unit: current.unit || "kg",
          stockStatus: current.stockStatus || "in_stock",
          isFeatured: Boolean(current.isFeatured),
          isPreorderOnly: Boolean(current.isPreorderOnly),
          minAdvanceHours: Number.isFinite(current.minAdvanceHours)
            ? current.minAdvanceHours
            : 24,
          preparationNotes: current.preparationNotes || ""
        });
        setExistingImageUrl(current.imageUrl || "");
      } else if (categoryList.length) {
        setForm((prev) => ({
          ...prev,
          category: prev.category || categoryList.find((cat) => !cat.isDeleted)?._id || ""
        }));
      }
    } catch (err) {
      setError(err.userMessage || err.message || "Failed to load form data");
    } finally {
      setInitializing(false);
    }
  }, [isEditMode, productId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const BOOLEAN_FIELDS = new Set(["isFeatured", "isPreorderOnly"]);

  const onChange = (field) => (event) => {
    const value = BOOLEAN_FIELDS.has(field) ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("name", String(form.name).trim());
      payload.append("description", String(form.description).trim());
      payload.append("price", String(form.price));
      payload.append("category", form.category);
      payload.append("unit", form.unit);
      payload.append("stockStatus", form.stockStatus);
      payload.append("isFeatured", String(form.isFeatured));
      payload.append("isPreorderOnly", String(form.isPreorderOnly));
      if (form.isPreorderOnly) {
        payload.append("minAdvanceHours", String(form.minAdvanceHours || 24));
        if (String(form.preparationNotes).trim() !== "") {
          payload.append("preparationNotes", String(form.preparationNotes));
        }
      }

      if (String(form.salePrice).trim() !== "") {
        payload.append("salePrice", String(form.salePrice));
      }
      if (imageFile) {
        payload.append("image", imageFile);
      }

      if (!isEditMode && !imageFile) {
        throw new Error("Product image is required");
      }

      if (isEditMode) {
        await updateProduct(productId, payload);
        showToast("Product updated successfully.");
      } else {
        await createProduct(payload);
        showToast("Product created successfully.");
      }

      navigate("/products", { replace: true });
    } catch (err) {
      const message = err.userMessage || err.message || "Failed to save product";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) return <p>Loading form...</p>;

  return (
    <section style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>{title}</h1>
        <Link to="/products">Back to products</Link>
      </div>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: 12,
          padding: 16,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#fff"
        }}
      >
        <label>
          Name
          <input
            value={form.name}
            onChange={onChange("name")}
            required
            minLength={2}
            maxLength={120}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </label>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={onChange("description")}
            required
            minLength={2}
            maxLength={2000}
            rows={5}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </label>

        <label>
          Price
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={onChange("price")}
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </label>

        <label>
          Sale Price (optional)
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.salePrice}
            onChange={onChange("salePrice")}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </label>

        <label>
          Category
          <select
            value={form.category}
            onChange={onChange("category")}
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Unit
          <select value={form.unit} onChange={onChange("unit")} required style={{ width: "100%", boxSizing: "border-box" }}>
            {UNIT_OPTIONS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>

        <label>
          Stock Status
          <select
            value={form.stockStatus}
            onChange={onChange("stockStatus")}
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          >
            {STOCK_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={form.isFeatured} onChange={onChange("isFeatured")} />
          Featured product
        </label>

        <fieldset
          style={{
            display: "grid",
            gap: 8,
            border: "1px solid #fde68a",
            background: "#fffbeb",
            padding: 12,
            borderRadius: 6
          }}
        >
          <legend style={{ color: "#92400e" }}>Preorder / fruit platter</legend>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={form.isPreorderOnly}
              onChange={onChange("isPreorderOnly")}
            />
            Preorder only (custom fruit platter / advance-notice product)
          </label>

          {form.isPreorderOnly ? (
            <>
              <label>
                Minimum advance notice (hours)
                <input
                  type="number"
                  min="1"
                  max="720"
                  step="1"
                  value={form.minAdvanceHours}
                  onChange={onChange("minAdvanceHours")}
                  required
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </label>
              <label>
                Preparation notes (shown internally)
                <textarea
                  value={form.preparationNotes}
                  onChange={onChange("preparationNotes")}
                  maxLength={1000}
                  rows={3}
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </label>
            </>
          ) : null}
        </fieldset>

        {isEditMode && existingImageUrl ? (
          <p>
            Current image:{" "}
            <a href={existingImageUrl} target="_blank" rel="noreferrer">
              Open image
            </a>
          </p>
        ) : null}

        <label>
          Product image {isEditMode ? "(optional)" : "(required)"}
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            required={!isEditMode}
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : isEditMode ? "Save changes" : "Create product"}
          </button>
          <button type="button" onClick={() => navigate("/products")} disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
};

export default ProductFormPage;
