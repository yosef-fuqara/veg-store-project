import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { EMPTY_STRUCTURED_ADDRESS, cityIdentifiersFromKey, normalizeStructuredAddress } from "../utils/structuredAddress";
import { deliveryAreaOptionLabel } from "../utils/deliveryAreaDisplay";

const suggestionListStyle = {
  position: "absolute",
  insetInlineStart: 0,
  insetInlineEnd: 0,
  top: "100%",
  marginTop: "4px",
  padding: "4px 0",
  listStyle: "none",
  background: "#ffffff",
  border: "1px solid #e8e3dc",
  borderRadius: "10px",
  boxShadow: "0 8px 24px rgba(28, 25, 23, 0.12)",
  maxHeight: "220px",
  overflowY: "auto",
  zIndex: 20
};

const suggestionItemStyle = {
  padding: "10px 14px",
  fontSize: "14px",
  cursor: "pointer",
  color: "#1c1917"
};

const CLEAR_BTN_SIZE = 36;

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "14px",
  fontWeight: 600,
  color: "#57534e",
  minWidth: 0
};

/**
 * Searchable city/village picker — typing filters the catalog; only a list selection is valid.
 */
const CitySearchableSelect = ({
  id,
  label,
  selectedKey,
  options,
  onSelect,
  placeholder,
  disabled,
  inputStyle,
  error,
  assignRef,
  onFocus,
  onBlur,
  emptyLabel
}) => {
  const { t } = useTranslation("common");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((item) => item.key === selectedKey) || null,
    [options, selectedKey]
  );

  useEffect(() => {
    if (selectedOption) {
      setQuery(selectedOption.label);
    } else if (!open) {
      setQuery("");
    }
  }, [selectedOption, selectedKey, open]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (item) => item.label.toLowerCase().includes(q) || item.key.toLowerCase().includes(q)
    );
  }, [options, query]);

  const showList = open && !disabled && (filtered.length > 0 || query.trim().length > 0);
  const hasValue = Boolean(selectedKey || query);

  const handleBlur = () => {
    window.setTimeout(() => {
      setOpen(false);
      if (selectedOption) {
        if (query.trim() !== selectedOption.label) {
          setQuery(selectedOption.label);
        }
      } else {
        setQuery("");
      }
      onBlur?.();
    }, 180);
  };

  return (
    <label style={{ ...labelStyle, position: "relative" }}>
      {label}
      <div ref={wrapRef} style={{ position: "relative" }}>
        <input
          ref={(node) => {
            inputRef.current = node;
            if (typeof assignRef === "function") assignRef(node);
          }}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          disabled={disabled}
          placeholder={selectedKey ? undefined : placeholder}
          onChange={(e) => {
            const text = e.target.value;
            setQuery(text);
            setOpen(true);
            if (!text.trim()) {
              onSelect(null);
            }
          }}
          onFocus={() => {
            onFocus?.();
            setOpen(true);
          }}
          onBlur={handleBlur}
          style={{
            ...inputStyle,
            paddingInlineEnd: hasValue && !disabled ? `${CLEAR_BTN_SIZE + 8}px` : inputStyle?.paddingInlineEnd
          }}
        />
        {hasValue && !disabled ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onSelect(null);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            onMouseDown={(e) => e.preventDefault()}
            aria-label={t("clearSearch")}
            style={{
              position: "absolute",
              insetInlineEnd: "4px",
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
            <X size={18} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
        {showList ? (
          <ul role="listbox" style={suggestionListStyle}>
            {filtered.length ? (
              filtered.map((item) => (
                <li
                  key={item.key}
                  role="option"
                  aria-selected={item.key === selectedKey}
                  style={suggestionItemStyle}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(item);
                    setQuery(item.label);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  {item.isLocal ? " ★" : ""}
                </li>
              ))
            ) : (
              <li style={{ ...suggestionItemStyle, color: "#a8a29e", cursor: "default" }}>{emptyLabel}</li>
            )}
          </ul>
        ) : null}
      </div>
      {error ? (
        <span style={{ fontSize: "12px", color: "#991b1b", display: "block", marginTop: "2px" }}>{error}</span>
      ) : null}
    </label>
  );
};

const TextField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  inputStyle,
  error,
  assignRef,
  onFocus,
  onBlur,
  maxLength
}) => (
  <label style={labelStyle}>
    {label}
    <input
      ref={assignRef}
      id={id}
      type="text"
      autoComplete="off"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      style={inputStyle}
    />
    {error ? (
      <span style={{ fontSize: "12px", color: "#991b1b", display: "block", marginTop: "2px" }}>{error}</span>
    ) : null}
  </label>
);

/**
 * Structured address: city (catalog only) → street → house number → optional extras.
 */
const StructuredAddressInput = ({
  value,
  onChange,
  deliveryArea = "",
  deliveryAreas = [],
  errors = {},
  inputStyle = () => ({}),
  assignFieldRef = () => () => {},
  onFieldFocus = () => () => {},
  onFieldBlur = () => () => {},
  showExtraFields = true,
  showDeliveryHelper = false,
  deliveryRules = null,
  localAreaKey = "",
  disabled = false,
  showLabelField = false
}) => {
  const { t, i18n } = useTranslation(["address", "checkout"]);
  const lang = (i18n.language || "he").split("-")[0];

  const addr = useMemo(
    () => ({ ...EMPTY_STRUCTURED_ADDRESS, ...normalizeStructuredAddress(value || {}, lang) }),
    [value, lang]
  );

  const selectedCityKey = (deliveryArea || addr.cityKey || "").trim();

  const catalogCities = useMemo(() => {
    if (!deliveryAreas?.length) return [];
    return deliveryAreas.map((area) => ({
      key: area.key,
      label: deliveryAreaOptionLabel(area, lang, t),
      isLocal: area.key === localAreaKey
    }));
  }, [deliveryAreas, lang, localAreaKey, t]);

  const emitChange = useCallback(
    (patch, meta = {}) => {
      const merged = { ...addr, ...patch };
      const key = (meta.deliveryArea ?? meta.cityKey ?? selectedCityKey ?? merged.cityKey ?? "").trim();
      const ids = cityIdentifiersFromKey(key);
      const next = normalizeStructuredAddress(
        {
          ...merged,
          ...ids,
          cityKey: ids.cityKey,
          cityId: ids.cityId,
          citySlug: ids.citySlug
        },
        lang
      );
      onChange(next, {
        deliveryArea: key,
        cityKey: key,
        ...meta
      });
    },
    [addr, lang, onChange, selectedCityKey]
  );

  const handleCitySelect = (item) => {
    if (!item?.key) {
      emitChange(
        {
          city: "",
          cityKey: "",
          cityId: "",
          citySlug: "",
          street: "",
          houseNumber: "",
          building: "",
          apartment: "",
          floor: "",
          entrance: ""
        },
        { deliveryArea: "", cityKey: "" }
      );
      return;
    }
    const label = item.label || "";
    emitChange(
      {
        city: label,
        ...cityIdentifiersFromKey(item.key),
        street: addr.street,
        houseNumber: addr.houseNumber,
        building: addr.building,
        apartment: addr.apartment,
        floor: addr.floor,
        entrance: addr.entrance
      },
      { deliveryArea: item.key, cityKey: item.key }
    );
  };

  const fieldErr = (key) => errors[key] || null;

  const optionalGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {showLabelField ? (
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: "#57534e" }}>
          {t("checkout:deliveryAddress")}
          <input
            value={addr.label || ""}
            maxLength={50}
            disabled={disabled}
            onChange={(e) => emitChange({ label: e.target.value })}
            style={inputStyle("deliveryAddress.label")}
          />
        </label>
      ) : null}

      <CitySearchableSelect
        id="structured-address-city"
        label={t("city")}
        selectedKey={selectedCityKey}
        options={catalogCities}
        onSelect={handleCitySelect}
        placeholder={t("cityPlaceholder")}
        disabled={disabled || catalogCities.length === 0}
        emptyLabel={t("noCitiesFound")}
        inputStyle={inputStyle("deliveryAddress.city")}
        error={fieldErr("deliveryAddress.city") || fieldErr("deliveryArea")}
        assignRef={assignFieldRef("deliveryAddress.city")}
        onFocus={onFieldFocus("deliveryAddress.city")}
        onBlur={onFieldBlur}
      />

      {showDeliveryHelper && deliveryRules ? (
        <span style={{ fontSize: "12px", color: "#a8a29e", display: "block", whiteSpace: "pre-line", marginTop: "-8px" }}>
          {t("deliveryAreaHelper", {
            localMin: deliveryRules.localFreeDeliveryMin,
            localFee: deliveryRules.localDeliveryFee,
            outsideMin: deliveryRules.outsideFreeDeliveryMin,
            outsideFee: deliveryRules.outsideDeliveryFee
          })}
        </span>
      ) : null}

      <TextField
        id="structured-address-street"
        label={t("street")}
        value={addr.street || ""}
        onChange={(text) => emitChange({ street: text })}
        placeholder={t("streetPlaceholder")}
        disabled={disabled}
        maxLength={120}
        inputStyle={inputStyle("deliveryAddress.street")}
        error={fieldErr("deliveryAddress.street")}
        assignRef={assignFieldRef("deliveryAddress.street")}
        onFocus={onFieldFocus("deliveryAddress.street")}
        onBlur={onFieldBlur}
      />

      <TextField
        id="structured-address-house-number"
        label={t("houseNumber")}
        value={addr.houseNumber || ""}
        onChange={(text) => emitChange({ houseNumber: text })}
        disabled={disabled}
        maxLength={30}
        inputStyle={inputStyle("deliveryAddress.houseNumber")}
        error={fieldErr("deliveryAddress.houseNumber")}
        assignRef={assignFieldRef("deliveryAddress.houseNumber")}
        onFocus={onFieldFocus("deliveryAddress.houseNumber")}
        onBlur={onFieldBlur}
      />

      {showExtraFields ? (
        <>
          <div style={optionalGridStyle}>
            <TextField
              id="structured-address-building"
              label={t("building")}
              value={addr.building || ""}
              onChange={(text) => emitChange({ building: text })}
              disabled={disabled}
              maxLength={50}
              inputStyle={inputStyle("deliveryAddress.building")}
              assignRef={assignFieldRef("deliveryAddress.building")}
              onFocus={onFieldFocus("deliveryAddress.building")}
              onBlur={onFieldBlur}
            />
            <TextField
              id="structured-address-entrance"
              label={t("entrance")}
              value={addr.entrance || ""}
              onChange={(text) => emitChange({ entrance: text })}
              disabled={disabled}
              maxLength={20}
              inputStyle={inputStyle("deliveryAddress.entrance")}
              assignRef={assignFieldRef("deliveryAddress.entrance")}
              onFocus={onFieldFocus("deliveryAddress.entrance")}
              onBlur={onFieldBlur}
            />
            <TextField
              id="structured-address-floor"
              label={t("floor")}
              value={addr.floor || ""}
              onChange={(text) => emitChange({ floor: text })}
              disabled={disabled}
              maxLength={20}
              inputStyle={inputStyle("deliveryAddress.floor")}
              assignRef={assignFieldRef("deliveryAddress.floor")}
              onFocus={onFieldFocus("deliveryAddress.floor")}
              onBlur={onFieldBlur}
            />
            <TextField
              id="structured-address-apartment"
              label={t("apartment")}
              value={addr.apartment || ""}
              onChange={(text) => emitChange({ apartment: text })}
              disabled={disabled}
              maxLength={50}
              inputStyle={inputStyle("deliveryAddress.apartment")}
              assignRef={assignFieldRef("deliveryAddress.apartment")}
              onFocus={onFieldFocus("deliveryAddress.apartment")}
              onBlur={onFieldBlur}
            />
          </div>

          <label style={labelStyle}>
            {t("notes")}
            <textarea
              ref={assignFieldRef("deliveryAddress.notes")}
              value={addr.notes || ""}
              maxLength={500}
              rows={2}
              disabled={disabled}
              onChange={(e) => emitChange({ notes: e.target.value })}
              onFocus={onFieldFocus("deliveryAddress.notes")}
              onBlur={onFieldBlur}
              style={{ ...inputStyle("deliveryAddress.notes"), resize: "vertical" }}
            />
          </label>
        </>
      ) : null}
    </div>
  );
};

export default StructuredAddressInput;
