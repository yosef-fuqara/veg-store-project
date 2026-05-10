export const VEGSTORE_CART_KEY = "vegstore_cart";
export const VEGSTORE_CHECKOUT_DRAFT_KEY = "vegstore_checkout_draft";

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
      quantity: Math.max(1, Number(i.quantity) || 1),
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
        quantity: Math.max(1, Number(l.quantity) || 1),
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
