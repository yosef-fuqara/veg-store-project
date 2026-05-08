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

const normalizeProductBody = (req, res, next) => {
  req.body.price = asOptionalNumber(req.body.price);
  req.body.salePrice = asOptionalNumber(req.body.salePrice);
  req.body.isFeatured = asOptionalBoolean(req.body.isFeatured);
  req.body.isFrozen = asOptionalBoolean(req.body.isFrozen);
  req.body.isPreorderOnly = asOptionalBoolean(req.body.isPreorderOnly);
  req.body.minAdvanceHours = asOptionalNumber(req.body.minAdvanceHours);
  next();
};

module.exports = normalizeProductBody;
