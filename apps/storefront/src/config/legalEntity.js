/**
 * Store legal identity used across legal pages and contact blocks.
 * Phone is the only published contact channel (no email or physical address).
 */
export const LEGAL_ENTITY = {
  storeName: "abu alanas Fruits & Vegetables",
  operatorName: "mostafa ziadneh",
  contactPhone: "0543486348"
};

const TOKEN_PATTERN = /\{\{\s*(storeName|operatorName|contactPhone)\s*\}\}/g;

/** Replace {{token}} placeholders inside a string with LEGAL_ENTITY values. */
export const fillLegalTokens = (text) => {
  if (typeof text !== "string") return text;
  return text.replace(TOKEN_PATTERN, (_match, key) => LEGAL_ENTITY[key] ?? "");
};
