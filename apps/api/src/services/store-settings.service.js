const StoreSettings = require("../models/store-settings.model");
const {
  normalizeSettingsForEvaluation,
  evaluateStoreOrderingGate,
  isOrderingCurrentlyAllowed,
  DEFAULT_TZ,
  DEFAULT_OPEN,
  DEFAULT_CLOSE
} = require("../utils/orderingAvailability");

const SETTINGS_KEY = "default";

const DEFAULT_CLOSED_TITLE = {
  he: "החנות סגורה זמנית",
  en: "Store temporarily closed",
  ar: "المتجر مغلق مؤقتًا"
};

function pickLang(obj, lang) {
  if (!obj || typeof obj !== "object") return "";
  const v = obj[lang];
  return typeof v === "string" ? v.trim() : "";
}

function mergeLocalized(docField, defaults) {
  const src = docField && typeof docField.toObject === "function" ? docField.toObject() : docField || {};
  return {
    he: pickLang(src, "he") || defaults.he || "",
    en: pickLang(src, "en") || defaults.en || "",
    ar: pickLang(src, "ar") || defaults.ar || ""
  };
}

function docToPlain(doc) {
  if (!doc) return {};
  return typeof doc.toObject === "function" ? doc.toObject() : doc;
}

async function getStoreSettingsDocument() {
  const doc = await StoreSettings.findOneAndUpdate(
    { singletonKey: SETTINGS_KEY },
    {
      $setOnInsert: {
        singletonKey: SETTINGS_KEY,
        isStoreOpen: true,
        closedTitle: { ...DEFAULT_CLOSED_TITLE },
        reopenAt: null,
        showWhatsappButton: true,
        operatingHoursEnabled: false,
        operatingTimezone: DEFAULT_TZ,
        operatingOpenLocal: DEFAULT_OPEN,
        operatingCloseLocal: DEFAULT_CLOSE
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
}

function buildComputedFromDoc(doc) {
  const plain = docToPlain(doc);
  const normalized = normalizeSettingsForEvaluation(plain);
  return evaluateStoreOrderingGate(normalized);
}

function toPublicPayload(doc, _at = new Date()) {
  const plain = docToPlain(doc);
  const closedTitle = mergeLocalized(plain.closedTitle, DEFAULT_CLOSED_TITLE);
  const closedMessage = mergeLocalized(plain.closedMessage, { he: "", en: "", ar: "" });

  const computed = buildComputedFromDoc(doc);

  return {
    isStoreOpen: plain.isStoreOpen !== false,
    closedTitle,
    closedMessage,
    reopenAt: plain.reopenAt ? new Date(plain.reopenAt).toISOString() : null,
    showWhatsappButton: plain.showWhatsappButton !== false,
    operatingHoursEnabled: plain.operatingHoursEnabled === true,
    operatingTimezone:
      typeof plain.operatingTimezone === "string" && plain.operatingTimezone.trim()
        ? plain.operatingTimezone.trim()
        : DEFAULT_TZ,
    operatingOpenLocal:
      typeof plain.operatingOpenLocal === "string" && plain.operatingOpenLocal.trim()
        ? plain.operatingOpenLocal.trim()
        : DEFAULT_OPEN,
    operatingCloseLocal:
      typeof plain.operatingCloseLocal === "string" && plain.operatingCloseLocal.trim()
        ? plain.operatingCloseLocal.trim()
        : DEFAULT_CLOSE,
    canOrderNow: computed.canOrderNow,
    storeClosedReason: computed.storeClosedReason,
    nextOpenAt: null
  };
}

function toAdminPayload(doc, at = new Date()) {
  const base = toPublicPayload(doc, at);
  return {
    ...base,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
    updatedBy: doc.updatedBy ? String(doc.updatedBy) : null
  };
}

function mergePatchLocalized(existing, patch) {
  const cur = mergeLocalized(existing, { he: "", en: "", ar: "" });
  if (!patch || typeof patch !== "object") return cur;
  const next = { ...cur };
  for (const lang of ["he", "en", "ar"]) {
    if (Object.prototype.hasOwnProperty.call(patch, lang)) {
      next[lang] = typeof patch[lang] === "string" ? patch[lang].trim() : "";
    }
  }
  return next;
}

async function updateStoreSettings(adminUserId, patch) {
  const doc = await getStoreSettingsDocument();

  if (typeof patch.isStoreOpen === "boolean") {
    doc.isStoreOpen = patch.isStoreOpen;
  }
  if (patch.closedTitle !== undefined) {
    doc.closedTitle = mergePatchLocalized(doc.closedTitle, patch.closedTitle);
  }
  if (patch.closedMessage !== undefined) {
    doc.closedMessage = mergePatchLocalized(doc.closedMessage, patch.closedMessage);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "reopenAt")) {
    doc.reopenAt = patch.reopenAt === null || patch.reopenAt === "" ? null : patch.reopenAt;
  }
  if (typeof patch.showWhatsappButton === "boolean") {
    doc.showWhatsappButton = patch.showWhatsappButton;
  }
  if (typeof patch.operatingHoursEnabled === "boolean") {
    doc.operatingHoursEnabled = patch.operatingHoursEnabled;
  }
  if (typeof patch.operatingTimezone === "string" && patch.operatingTimezone.trim()) {
    doc.operatingTimezone = patch.operatingTimezone.trim();
  }
  if (typeof patch.operatingOpenLocal === "string" && patch.operatingOpenLocal.trim()) {
    doc.operatingOpenLocal = patch.operatingOpenLocal.trim();
  }
  if (typeof patch.operatingCloseLocal === "string" && patch.operatingCloseLocal.trim()) {
    doc.operatingCloseLocal = patch.operatingCloseLocal.trim();
  }

  if (adminUserId) {
    doc.updatedBy = adminUserId;
  }

  await doc.save();
  return doc;
}

async function isStoreOpenForOrders(at = new Date()) {
  const doc = await getStoreSettingsDocument();
  return isOrderingCurrentlyAllowed(docToPlain(doc), at);
}

/**
 * @returns {Promise<{ statusCode: number, body: object } | null>}
 */
async function getOrderCreationBlockResponse() {
  const doc = await getStoreSettingsDocument();
  const plain = docToPlain(doc);
  const gate = evaluateStoreOrderingGate(normalizeSettingsForEvaluation(plain));
  if (gate.canOrderNow) return null;

  return {
    statusCode: 503,
    body: {
      success: false,
      message: "החנות סגורה זמנית",
      code: "STORE_CLOSED"
    }
  };
}

module.exports = {
  SETTINGS_KEY,
  DEFAULT_CLOSED_TITLE,
  getStoreSettingsDocument,
  toPublicPayload,
  toAdminPayload,
  updateStoreSettings,
  isStoreOpenForOrders,
  getOrderCreationBlockResponse,
  isOrderingCurrentlyAllowed,
  buildComputedFromDoc
};
