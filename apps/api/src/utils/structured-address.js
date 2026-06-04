const { pickLocalizedName, getDeliveryArea } = require("../constants/delivery");

const EMPTY_STRUCTURED_ADDRESS = {
  label: "",
  city: "",
  street: "",
  houseNumber: "",
  building: "",
  apartment: "",
  floor: "",
  entrance: "",
  notes: "",
  fullAddress: ""
};

/**
 * Legacy orders may use `building` as the house number.
 */
const resolveHouseNumber = (addr = {}) => {
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
    const label =
      lang === "ar" ? "شقة" : lang === "en" ? "Apt" : "דירה";
    parts.push(`${label} ${apt}`);
  }
  if (floor) {
    const label =
      lang === "ar" ? "طابق" : lang === "en" ? "Floor" : "קומה";
    parts.push(`${label} ${floor}`);
  }
  if (entrance) {
    const label =
      lang === "ar" ? "مدخل" : lang === "en" ? "Entrance" : "כניסה";
    parts.push(`${label} ${entrance}`);
  }
  if (building && building !== houseNumber) {
    const label =
      lang === "ar" ? "مبنى" : lang === "en" ? "Bldg" : "בניין";
    parts.push(`${label} ${building}`);
  }
  return parts;
};

/**
 * Build a single-line address for display, search, and backward compatibility.
 */
const buildFullAddress = (addr = {}, lang = "he") => {
  if (typeof addr.fullAddress === "string" && addr.fullAddress.trim()) {
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
    const noteLabel =
      lang === "ar" ? "ملاحظات" : lang === "en" ? "Notes" : "הערות";
    lineParts.push(`${noteLabel}: ${notes}`);
  }

  return lineParts.filter(Boolean).join(", ");
};

/**
 * Normalize inbound address (API body, legacy snapshots).
 */
const normalizeStructuredAddress = (input = {}, options = {}) => {
  const lang = options.lang || "he";
  const cityKey = options.cityKey || options.deliveryAreaKey || "";

  if (typeof input === "string") {
    const trimmed = input.trim();
    return {
      ...EMPTY_STRUCTURED_ADDRESS,
      fullAddress: trimmed,
      city: trimmed
    };
  }

  const raw = input && typeof input === "object" ? input : {};
  let city = typeof raw.city === "string" ? raw.city.trim() : "";

  if (!city && cityKey) {
    const area = getDeliveryArea(cityKey);
    city = pickLocalizedName(area?.names, lang) || city;
  }

  const houseNumber = resolveHouseNumber(raw);
  const normalized = {
    label: typeof raw.label === "string" ? raw.label.trim() : "",
    city,
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

/**
 * Format for WhatsApp / email — prefers fullAddress when present.
 */
const formatDeliveryAddressLine = (deliveryAddress, lang = "he") => {
  if (!deliveryAddress) return "";
  if (typeof deliveryAddress === "string") {
    return deliveryAddress.trim();
  }
  const full = buildFullAddress(deliveryAddress, lang);
  if (full) return full;
  return "";
};

module.exports = {
  EMPTY_STRUCTURED_ADDRESS,
  resolveHouseNumber,
  buildFullAddress,
  normalizeStructuredAddress,
  formatDeliveryAddressLine
};
