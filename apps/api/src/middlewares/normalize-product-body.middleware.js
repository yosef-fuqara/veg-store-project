const asOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const asOptionalBoolean = (value) => {
  if (value === undefined || value === null || value === "") {
    return value;
  }

  if (value === true || value === false) {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
};

const tryParseNameField = (value) => {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) {
    return value;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const normalizeProductBody = (req, res, next) => {
  if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
    req.body.name = tryParseNameField(req.body.name);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "price")) {
    req.body.price = asOptionalNumber(req.body.price);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "salePrice")) {
    req.body.salePrice = asOptionalNumber(req.body.salePrice);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "isFeatured")) {
    req.body.isFeatured = asOptionalBoolean(req.body.isFeatured);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "isFrozen")) {
    req.body.isFrozen = asOptionalBoolean(req.body.isFrozen);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "isPreorderOnly")) {
    req.body.isPreorderOnly = asOptionalBoolean(req.body.isPreorderOnly);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "allowPurchaseByAmount")) {
    req.body.allowPurchaseByAmount = asOptionalBoolean(req.body.allowPurchaseByAmount);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "minAdvanceHours")) {
    req.body.minAdvanceHours = asOptionalNumber(req.body.minAdvanceHours);
  }
  next();
};

module.exports = normalizeProductBody;
