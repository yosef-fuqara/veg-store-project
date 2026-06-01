export const VEGSTORE_CART_KEY = "vegstore_cart";
export const VEGSTORE_CHECKOUT_DRAFT_KEY = "vegstore_checkout_draft";
export const VEGSTORE_SAVED_DELIVERY_KEY = "vegstore_saved_delivery";

const safeParse = (raw) => {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/** Minimal cart lines for restore (no payment or PII beyond what the cart already holds). */
export function persistCartFromServerCart(cart) {
  if (typeof window === "undefined") return;
  try {
    const items = cart?.items;
    if (!Array.isArray(items) || items.length === 0) {
      window.localStorage.removeItem(VEGSTORE_CART_KEY);
      return;
    }
    const lines = items.map((i) => ({
      product: i.product,
      quantity: Math.max(0.01, Number(i.quantity) || 1),
      wrap: Boolean(i.wrap)
    }));
    window.localStorage.setItem(VEGSTORE_CART_KEY, JSON.stringify(lines));
  } catch {
    /* ignore */
  }
}

export function loadPersistedCartLines() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = safeParse(window.localStorage.getItem(VEGSTORE_CART_KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && l.product)
      .map((l) => ({
        product: l.product,
        quantity: Math.max(0.01, Number(l.quantity) || 1),
        wrap: Boolean(l.wrap)
      }));
  } catch {
    return [];
  }
}

export function clearPersistedCart() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(VEGSTORE_CART_KEY);
  } catch {
    /* ignore */
  }
}

/** Non-sensitive checkout fields only (no payment method). */
export function loadCheckoutDraft() {
  if (typeof window === "undefined") return null;
  const data = safeParse(window.localStorage.getItem(VEGSTORE_CHECKOUT_DRAFT_KEY));
  if (!data || typeof data !== "object") return null;
  return data;
}

export function clearCheckoutDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(VEGSTORE_CHECKOUT_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function clearOrderSuccessStorage() {
  clearPersistedCart();
  clearCheckoutDraft();
}

const hasNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

/** True when persisted saved-delivery payload contains at least one field. */
export function hasSavedDeliveryDetails(data) {
  if (!data || typeof data !== "object") return false;
  if (hasNonEmptyString(data.customerPhone) || hasNonEmptyString(data.deliveryArea)) return true;
  const addr = data.deliveryAddress;
  if (!addr || typeof addr !== "object") return false;
  return (
    hasNonEmptyString(addr.street) ||
    hasNonEmptyString(addr.building) ||
    hasNonEmptyString(addr.apartment) ||
    hasNonEmptyString(addr.notes)
  );
}

export function checkoutDraftHasDeliveryContent(draft) {
  if (!draft || typeof draft !== "object") return false;
  const addr = draft.deliveryAddress;
  if (addr && typeof addr === "object") {
    if (
      hasNonEmptyString(addr.street) ||
      hasNonEmptyString(addr.building) ||
      hasNonEmptyString(addr.apartment) ||
      hasNonEmptyString(addr.notes)
    ) {
      return true;
    }
  }
  return (
    hasNonEmptyString(draft.deliveryArea) ||
    hasNonEmptyString(draft.customerPhone) ||
    hasNonEmptyString(draft.notes) ||
    hasNonEmptyString(draft.preferredDeliveryAt) ||
    hasNonEmptyString(draft.customRequest)
  );
}

/** Delivery/contact fields only — never payment or preorder-specific data. */
export function deliveryDetailsForPersistence(form) {
  const addr = form?.deliveryAddress && typeof form.deliveryAddress === "object" ? form.deliveryAddress : {};
  return {
    v: 1,
    customerPhone: typeof form?.customerPhone === "string" ? form.customerPhone.trim() : "",
    deliveryArea: typeof form?.deliveryArea === "string" ? form.deliveryArea : "",
    deliveryAddress: {
      street: typeof addr.street === "string" ? addr.street.trim() : "",
      building: typeof addr.building === "string" ? addr.building.trim() : "",
      apartment: typeof addr.apartment === "string" ? addr.apartment.trim() : "",
      notes: typeof addr.notes === "string" ? addr.notes.trim() : ""
    }
  };
}

export function loadSavedDeliveryDetails() {
  if (typeof window === "undefined") return null;
  const data = safeParse(window.localStorage.getItem(VEGSTORE_SAVED_DELIVERY_KEY));
  if (!data || typeof data !== "object") return null;
  return data;
}

export function saveSavedDeliveryDetails(details) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VEGSTORE_SAVED_DELIVERY_KEY, JSON.stringify(details));
  } catch {
    /* ignore */
  }
}

export function clearSavedDeliveryDetails() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(VEGSTORE_SAVED_DELIVERY_KEY);
  } catch {
    /* ignore */
  }
}

export function mergeSavedDeliveryIntoForm(saved, base) {
  if (!saved || typeof saved !== "object") return base;
  const addr =
    saved.deliveryAddress && typeof saved.deliveryAddress === "object" ? saved.deliveryAddress : {};
  return {
    ...base,
    deliveryAddress: {
      street: typeof addr.street === "string" ? addr.street : base.deliveryAddress.street,
      building: typeof addr.building === "string" ? addr.building : base.deliveryAddress.building,
      apartment: typeof addr.apartment === "string" ? addr.apartment : base.deliveryAddress.apartment,
      notes: typeof addr.notes === "string" ? addr.notes : base.deliveryAddress.notes
    },
    deliveryArea: typeof saved.deliveryArea === "string" ? saved.deliveryArea : base.deliveryArea,
    customerPhone:
      typeof saved.customerPhone === "string" ? saved.customerPhone : base.customerPhone
  };
}
