const {
  ALLOWED_DELIVERY_AREAS,
  pickLocalizedName
} = require("../constants/delivery");

const normalizeLang = (lang) => {
  const short = String(lang || "he").split("-")[0].toLowerCase();
  return ["he", "ar", "en"].includes(short) ? short : "he";
};

const normalizeQuery = (q) => String(q || "").trim().toLowerCase();

/**
 * @param {string} query
 * @param {string} language
 * @param {{ restrictToDeliveryAreas?: boolean }} [options]
 */
const searchCities = (query, language, options = {}) => {
  const lang = normalizeLang(language);
  const q = normalizeQuery(query);
  const restrict = options.restrictToDeliveryAreas !== false;

  let areas = ALLOWED_DELIVERY_AREAS;
  if (!restrict) {
    areas = ALLOWED_DELIVERY_AREAS;
  }

  const results = areas
    .map((area) => {
      const label = pickLocalizedName(area.names, lang);
      return {
        key: area.key,
        label,
        isLocal: Boolean(area.isLocal)
      };
    })
    .filter((item) => {
      if (!q) return true;
      return item.label.toLowerCase().includes(q) || item.key.includes(q);
    })
    .slice(0, 20);

  return results;
};

module.exports = {
  searchCities
};
