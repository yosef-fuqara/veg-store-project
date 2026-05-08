import apiClient from "./apiClient";

export const fetchCart = async () => {
  const { data } = await apiClient.get("/cart");
  return data.data.cart;
};

export const addCartItem = async (productId, quantity = 1, options = {}) => {
  const payload = { productId, quantity };
  if (typeof options.wrap === "boolean") payload.wrap = options.wrap;
  const { data } = await apiClient.post("/cart/items", payload);
  return data.data.cart;
};

// `updates` may be either a number (legacy: quantity-only) or an object
// `{ quantity?, wrap? }` so the cart UI can toggle the wrap service without
// touching the quantity.
export const updateCartItem = async (productId, updates) => {
  const payload = typeof updates === "number" ? { quantity: updates } : { ...updates };
  const { data } = await apiClient.patch(`/cart/items/${productId}`, payload);
  return data.data.cart;
};

export const removeCartItem = async (productId) => {
  const { data } = await apiClient.delete(`/cart/items/${productId}`);
  return data.data.cart;
};

export const clearCart = async () => {
  const { data } = await apiClient.delete("/cart");
  return data.data.cart;
};

export const prepareCheckout = async () => {
  const { data } = await apiClient.post("/cart/checkout/prepare");
  return data.data.checkout;
};
