/** Client-side structured address helpers (mirrors API shape). */

/** Stable city identifiers saved with addresses/orders (`cityKey` === `deliveryArea`). */
export const cityIdentifiersFromKey = (cityKey = "") => {
  const key = typeof cityKey === "string" ? cityKey.trim() : "";
  if (!key) return { cityId: "", citySlug: "", cityKey: "" };
  return { cityId: key, citySlug: key, cityKey: key };
};

export const EMPTY_STRUCTURED_ADDRESS = {
  label: "",
  city: "",
  cityKey: "",
  cityId: "",
  citySlug: "",
  street: "",
  houseNumber: "",
  building: "",
  apartment: "",
  floor: "",
  entrance: "",
  notes: "",
  fullAddress: ""
};

export const resolveHouseNumber = (addr = {}) => {
  const house = typeof addr.houseNumber === "string" ? addr.houseNumber.trim() : "";
  if (house) return house;
  const building = typeof addr.building === "string" ? addr.building.trim() : "";
  return building;
};

const formatExtraParts = (addr, lang = "he") => {
  const parts = [];
  const apt = typeof addr.apartment === "string" ? addr.apartment.trim() : "";
  const floor = typeof addr.floor === "string" ? addr.floor.trim() : "";
  const entrance = typeof addr.entrance === "string" ? addr.entrance.trim() : "";
  const building = typeof addr.building === "string" ? addr.building.trim() : "";
  const houseNumber = resolveHouseNumber(addr);

  if (apt) {
    const label = lang === "ar" ? "شقة" : lang === "en" ? "Apt" : "דירה";
    parts.push(`${label} ${apt}`);
  }
  if (floor) {
    const label = lang === "ar" ? "طابق" : lang === "en" ? "Floor" : "קומה";
    parts.push(`${label} ${floor}`);
  }
  if (entrance) {
    const label = lang === "ar" ? "مدخل" : lang === "en" ? "Entrance" : "כניסה";
    parts.push(`${label} ${entrance}`);
  }
  if (building && building !== houseNumber) {
    const label = lang === "ar" ? "مبنى" : lang === "en" ? "Bldg" : "בניין";
    parts.push(`${label} ${building}`);
  }
  return parts;
};

export const buildFullAddress = (addr = {}, lang = "he") => {
  if (typeof addr?.fullAddress === "string" && addr.fullAddress.trim()) {
    return addr.fullAddress.trim();
  }
  if (typeof addr === "string" && addr.trim()) {
    return addr.trim();
  }

  const street = typeof addr.street === "string" ? addr.street.trim() : "";
  const city = typeof addr.city === "string" ? addr.city.trim() : "";
  const houseNumber = resolveHouseNumber(addr);
  const notes = typeof addr.notes === "string" ? addr.notes.trim() : "";

  const lineParts = [];
  if (street && houseNumber) {
    lineParts.push(`${street} ${houseNumber}`);
  } else if (street) {
    lineParts.push(street);
  } else if (houseNumber) {
    lineParts.push(houseNumber);
  }

  const extras = formatExtraParts(addr, lang);
  if (extras.length) {
    lineParts.push(extras.join(", "));
  }
  if (city) {
    lineParts.push(city);
  }
  if (notes) {
    const noteLabel = lang === "ar" ? "ملاحظات" : lang === "en" ? "Notes" : "הערות";
    lineParts.push(`${noteLabel}: ${notes}`);
  }

  return lineParts.filter(Boolean).join(", ");
};

export const normalizeStructuredAddress = (input = {}, lang = "he") => {
  if (typeof input === "string") {
    const trimmed = input.trim();
    return { ...EMPTY_STRUCTURED_ADDRESS, fullAddress: trimmed, city: trimmed };
  }
  const raw = input && typeof input === "object" ? input : {};
  const houseNumber = resolveHouseNumber(raw);
  const cityKey =
    (typeof raw.cityKey === "string" && raw.cityKey.trim()) ||
    (typeof raw.cityId === "string" && raw.cityId.trim()) ||
    "";
  const ids = cityIdentifiersFromKey(cityKey);
  const normalized = {
    label: typeof raw.label === "string" ? raw.label.trim() : "",
    city: typeof raw.city === "string" ? raw.city.trim() : "",
    cityKey: ids.cityKey,
    cityId: ids.cityId,
    citySlug: ids.citySlug,
    street: typeof raw.street === "string" ? raw.street.trim() : "",
    houseNumber,
    building: typeof raw.building === "string" ? raw.building.trim() : "",
    apartment: typeof raw.apartment === "string" ? raw.apartment.trim() : "",
    floor: typeof raw.floor === "string" ? raw.floor.trim() : "",
    entrance: typeof raw.entrance === "string" ? raw.entrance.trim() : "",
    notes: typeof raw.notes === "string" ? raw.notes.trim() : "",
    fullAddress: ""
  };
  normalized.fullAddress = buildFullAddress(normalized, lang);
  return normalized;
};

/** Display line for order history / confirmation (backward compatible). */
export const formatAddressForDisplay = (address, lang = "he") => {
  if (!address) return "—";
  if (typeof address === "string") return address.trim() || "—";
  const full = buildFullAddress(address, lang);
  if (full) return full;
  return "—";
};

/**
 * @param {object} addr
 * @param {string} cityKey - delivery area key
 * @param {function} t - i18n t from address namespace
 * @param {{ restrictToDeliveryAreas?: boolean, allowedCityKeys?: Set<string> }} options
 */
/** Shape used when persisting structured delivery details (orders + saved addresses). */
export const buildDeliveryAddressDetails = (addr = {}, cityKey = "", lang = "he") => {
  const normalized = normalizeStructuredAddress(addr, lang);
  const key = (cityKey || normalized.cityKey || "").trim();
  const ids = cityIdentifiersFromKey(key);
  return {
    ...ids,
    cityName: normalized.city,
    street: normalized.street,
    houseNumber: normalized.houseNumber,
    building: normalized.building,
    apartment: normalized.apartment,
    floor: normalized.floor,
    entrance: normalized.entrance,
    notes: normalized.notes,
    fullAddress: normalized.fullAddress
  };
};

export const validateStructuredAddress = (addr, cityKey, t, options = {}) => {
  const fields = {};
  const normalized = normalizeStructuredAddress(addr);
  const key = (cityKey || normalized.cityKey || normalized.cityId || "").trim();
  const listError = t("cityMustSelectFromList");

  if (!key) {
    fields["deliveryAddress.city"] = listError;
  }

  if (options.restrictToDeliveryAreas !== false && options.allowedCityKeys?.size) {
    if (key && !options.allowedCityKeys.has(key)) {
      fields["deliveryAddress.city"] = t("deliveryUnavailable");
    }
  }

  if (!normalized.street) {
    fields["deliveryAddress.street"] = t("streetRequired");
  }

  if (!normalized.houseNumber) {
    fields["deliveryAddress.houseNumber"] = t("houseNumberRequired");
  }

  return { ok: Object.keys(fields).length === 0, fields, normalized, cityKey: key };
};

/** Map legacy persisted checkout shape to structured address + deliveryArea. */
export const legacyDeliveryToStructured = (deliveryAddress = {}, deliveryArea = "", lang = "he") => {
  const normalized = normalizeStructuredAddress(deliveryAddress, lang);
  return {
    ...normalized,
    cityKey: deliveryArea || normalized.cityKey || "",
    houseNumber: normalized.houseNumber || normalized.building || ""
  };
};
