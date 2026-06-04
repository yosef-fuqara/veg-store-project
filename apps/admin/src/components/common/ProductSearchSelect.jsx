import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, X } from "lucide-react";
import { useAdminLanguage } from "../../i18n/useAdminLanguage.js";
import {
  getAdminProductSearchHaystack,
  getLocalizedProductName,
  getActiveAdminLanguage
} from "../../utils/localizedDisplayName.js";

const MAX_VISIBLE = 30;
const CLEAR_BTN_SIZE = 36;

const listStyle = {
  position: "absolute",
  insetInlineStart: 0,
  insetInlineEnd: 0,
  top: "100%",
  marginTop: "4px",
  padding: "4px 0",
  margin: "4px 0 0",
  listStyle: "none",
  background: "#ffffff",
  border: "1px solid #e8e3dc",
  borderRadius: "10px",
  boxShadow: "0 8px 24px rgba(28, 25, 23, 0.12)",
  maxHeight: "280px",
  overflowY: "auto",
  zIndex: 40,
  textAlign: "start"
};

const optionStyle = {
  padding: "10px 12px",
  fontSize: "14px",
  cursor: "pointer",
  color: "#1c1917"
};

const optionActiveStyle = {
  ...optionStyle,
  background: "#f5f0e8"
};

function normalizeQuery(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function productIdOf(product) {
  if (!product || typeof product !== "object") return "";
  const id = /** @type {{ _id?: unknown }} */ (product)._id;
  return id != null ? String(id) : "";
}

function matchesProductQuery(product, normalizedQuery) {
  if (!normalizedQuery) return true;
  const haystack = getAdminProductSearchHaystack(product);
  return haystack.includes(normalizedQuery);
}

const defaultInputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #e8e3dc",
  fontSize: "14px",
  boxSizing: "border-box",
  fontFamily: "inherit",
  textAlign: "start"
};

/**
 * Searchable product combobox for admin modals/forms.
 */
export function ProductSearchSelect({
  products = [],
  value = "",
  onChange,
  language,
  placeholder,
  disabled = false,
  loading = false,
  error,
  className,
  required = false,
  inputStyle,
  id: idProp,
  name,
  onFocus,
  onBlur,
  "aria-labelledby": ariaLabelledBy
}) {
  const { t } = useTranslation("common");
  const { dir } = useAdminLanguage();
  const autoId = useId();
  const inputId = idProp || `product-search-${autoId}`;
  const listboxId = `${inputId}-listbox`;

  const lang = language != null && language !== "" ? language : getActiveAdminLanguage();
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const sortedProducts = useMemo(() => {
    const list = Array.isArray(products) ? [...products] : [];
    return list.sort((a, b) =>
      getLocalizedProductName(a, lang).localeCompare(getLocalizedProductName(b, lang), undefined, {
        sensitivity: "base"
      })
    );
  }, [products, lang]);

  const selectedProduct = useMemo(
    () => sortedProducts.find((p) => productIdOf(p) === String(value)) || null,
    [sortedProducts, value]
  );

  const normalizedQuery = useMemo(() => normalizeQuery(query), [query]);

  const filteredProducts = useMemo(() => {
    const matched = sortedProducts.filter((p) => matchesProductQuery(p, normalizedQuery));
    return matched.slice(0, MAX_VISIBLE);
  }, [sortedProducts, normalizedQuery]);

  const displayValue = open ? query : selectedProduct ? getLocalizedProductName(selectedProduct, lang) : query;

  useEffect(() => {
    if (!open && selectedProduct) {
      setQuery(getLocalizedProductName(selectedProduct, lang));
    } else if (!open && !value) {
      setQuery("");
    }
  }, [open, selectedProduct, value, lang]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(/** @type {Node} */ (e.target))) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-option-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const selectProduct = useCallback(
    (product) => {
      const id = productIdOf(product);
      onChange(id);
      setQuery(getLocalizedProductName(product, lang));
      setOpen(false);
      setActiveIndex(-1);
    },
    [onChange, lang]
  );

  const clearSelection = useCallback(() => {
    onChange("");
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [onChange]);

  const handleBlur = () => {
    window.setTimeout(() => {
      setOpen(false);
      setActiveIndex(-1);
      if (selectedProduct) {
        setQuery(getLocalizedProductName(selectedProduct, lang));
      } else if (!value) {
        setQuery("");
      }
      onBlur?.();
    }, 180);
  };

  const isDisabled = disabled || loading;
  const hasSelection = Boolean(value);
  const showClear = hasSelection && !isDisabled;
  const showList = open && !isDisabled;
  const placeholderText =
    placeholder ||
    (loading ? t("productSearchSelect.loading") : t("productSearchSelect.placeholder"));

  const paddingInlineEnd = showClear ? `${CLEAR_BTN_SIZE + 28}px` : "36px";

  const borderColor = error ? "#fecaca" : "#e8e3dc";
  const mergedInputStyle = {
    ...defaultInputStyle,
    ...inputStyle,
    borderColor: error ? "#fca5a5" : inputStyle?.borderColor || borderColor,
    paddingInlineEnd,
    textAlign: "start"
  };

  const handleKeyDown = (e) => {
    if (isDisabled) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      if (selectedProduct) {
        setQuery(getLocalizedProductName(selectedProduct, lang));
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(filteredProducts.length ? 0 : -1);
        return;
      }
      setActiveIndex((i) => {
        if (!filteredProducts.length) return -1;
        if (i < 0) return 0;
        return Math.min(i + 1, filteredProducts.length - 1);
      });
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(filteredProducts.length ? filteredProducts.length - 1 : -1);
        return;
      }
      setActiveIndex((i) => {
        if (!filteredProducts.length) return -1;
        if (i <= 0) return 0;
        return i - 1;
      });
      return;
    }

    if (e.key === "Enter" && open) {
      e.preventDefault();
      if (activeIndex >= 0 && filteredProducts[activeIndex]) {
        selectProduct(filteredProducts[activeIndex]);
      }
    }
  };

  return (
    <div ref={wrapRef} className={className} style={{ position: "relative", minWidth: 0 }}>
      {required ? (
        <input
          tabIndex={-1}
          aria-hidden="true"
          name={name}
          value={value || ""}
          required
          readOnly
          onChange={() => {}}
          style={{
            position: "absolute",
            opacity: 0,
            width: 0,
            height: 0,
            pointerEvents: "none",
            border: "none",
            padding: 0,
            margin: 0
          }}
        />
      ) : null}
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        aria-controls={showList ? listboxId : undefined}
        aria-activedescendant={
          showList && activeIndex >= 0 ? `${inputId}-opt-${activeIndex}` : undefined
        }
        aria-labelledby={ariaLabelledBy}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        autoComplete="off"
        disabled={isDisabled}
        dir={dir}
        value={displayValue}
        placeholder={!hasSelection || open ? placeholderText : undefined}
        onChange={(e) => {
          const text = e.target.value;
          setQuery(text);
          setOpen(true);
          setActiveIndex(-1);
          if (!text.trim()) {
            onChange("");
          }
        }}
        onFocus={() => {
          onFocus?.();
          setOpen(true);
          if (selectedProduct && !query) {
            setQuery(getLocalizedProductName(selectedProduct, lang));
          }
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={mergedInputStyle}
      />
      <ChevronDown
        aria-hidden
        size={16}
        strokeWidth={2}
        style={{
          position: "absolute",
          insetInlineEnd: showClear ? `${CLEAR_BTN_SIZE + 4}px` : "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#a8a29e",
          pointerEvents: "none",
          zIndex: 1
        }}
      />
      {showClear ? (
        <button
          type="button"
          onClick={clearSelection}
          onMouseDown={(e) => e.preventDefault()}
          aria-label={t("productSearchSelect.clearSelection")}
          style={{
            position: "absolute",
            insetInlineEnd: "2px",
            top: "50%",
            transform: "translateY(-50%)",
            width: `${CLEAR_BTN_SIZE}px`,
            height: `${CLEAR_BTN_SIZE}px`,
            minWidth: `${CLEAR_BTN_SIZE}px`,
            minHeight: `${CLEAR_BTN_SIZE}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            margin: 0,
            border: "none",
            borderRadius: "8px",
            background: "transparent",
            color: "#a8a29e",
            cursor: "pointer",
            zIndex: 3,
            pointerEvents: "auto",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation"
          }}
        >
          <X size={16} strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
      {showList ? (
        <ul id={listboxId} ref={listRef} role="listbox" style={listStyle} dir={dir}>
          {filteredProducts.length ? (
            filteredProducts.map((product, index) => {
              const pid = productIdOf(product);
              const label = getLocalizedProductName(product, lang);
              const isActive = index === activeIndex;
              const isSelected = pid === String(value);
              return (
                <li
                  key={pid}
                  id={`${inputId}-opt-${index}`}
                  data-option-index={index}
                  role="option"
                  aria-selected={isSelected}
                  style={isActive ? optionActiveStyle : optionStyle}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectProduct(product);
                  }}
                >
                  {label}
                </li>
              );
            })
          ) : (
            <li style={{ ...optionStyle, color: "#a8a29e", cursor: "default" }}>
              {t("productSearchSelect.noResults")}
            </li>
          )}
        </ul>
      ) : null}
      {error ? (
        <span
          id={`${inputId}-error`}
          role="alert"
          style={{ fontSize: "12px", color: "#991b1b", display: "block", marginTop: "6px", textAlign: "start" }}
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
