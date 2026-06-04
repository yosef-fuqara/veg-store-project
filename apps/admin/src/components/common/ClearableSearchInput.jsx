import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";

const NATIVE_SEARCH_CANCEL_HIDE = `
  .clearable-search-input__field::-webkit-search-cancel-button,
  .clearable-search-input__field::-webkit-search-decoration,
  .clearable-search-input__field::-webkit-search-results-button {
    -webkit-appearance: none;
    appearance: none;
    display: none;
  }
`;

const CLEAR_BTN_SIZE = 36;

/**
 * Admin list search with search icon + clear button when value is non-empty.
 */
export function ClearableSearchInput({
  value,
  onChange,
  onClear,
  placeholder,
  disabled = false,
  autoFocus = false,
  dir,
  ariaLabel,
  clearAriaLabel,
  className,
  wrapperStyle,
  inputStyle,
  onInputFocus,
  onInputBlur,
}) {
  const { t } = useTranslation("common");
  const inputRef = useRef(null);
  const hasValue = Boolean(value);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const paddingInlineStart = "34px";
  const paddingInlineEnd = hasValue ? `${CLEAR_BTN_SIZE + 6}px` : "12px";

  return (
    <div
      className={className}
      style={{ position: "relative", minWidth: 0, ...wrapperStyle }}
    >
      <style>{NATIVE_SEARCH_CANCEL_HIDE}</style>
      <Search
        aria-hidden
        size={14}
        strokeWidth={2.5}
        style={{
          position: "absolute",
          insetInlineStart: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#a8a29e",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <input
        ref={inputRef}
        className="clearable-search-input__field"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        autoComplete="off"
        disabled={disabled}
        autoFocus={autoFocus}
        dir={dir}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
        style={{
          width: "100%",
          boxSizing: "border-box",
          minWidth: 0,
          paddingTop: "8px",
          paddingBottom: "8px",
          ...inputStyle,
          paddingInlineStart,
          paddingInlineEnd,
        }}
      />
      {hasValue && !disabled ? (
        <button
          type="button"
          onClick={handleClear}
          onMouseDown={(e) => e.preventDefault()}
          aria-label={clearAriaLabel || t("clearSearch")}
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
            zIndex: 2,
            pointerEvents: "auto",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
        >
          <X size={16} strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
