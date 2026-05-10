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

const normalizeAnnouncementBody = (req, res, next) => {
  if (Object.prototype.hasOwnProperty.call(req.body, "durationHours")) {
    req.body.durationHours = asOptionalNumber(req.body.durationHours);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
    req.body.isActive = asOptionalBoolean(req.body.isActive);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "removeImage")) {
    req.body.removeImage = asOptionalBoolean(req.body.removeImage);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "cta")) {
    const raw = req.body.cta;
    if (typeof raw === "string") {
      const s = raw.trim();
      if (!s) {
        delete req.body.cta;
      } else {
        try {
          req.body.cta = JSON.parse(s);
        } catch {
          req.body.cta = { type: "__invalid_json__" };
        }
      }
    }
  }
  next();
};

module.exports = normalizeAnnouncementBody;
