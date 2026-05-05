import apiClient from "./apiClient";

export const fetchCart = async () => {
  const { data } = await apiClient.get("/cart");
  return data.data.cart;
};

export const addCartItem = async (productId, quantity = 1) => {
  const { data } = await apiClient.post("/cart/items", { productId, quantity });
  return data.data.cart;
};

export const updateCartItem = async (productId, quantity) => {
  const { data } = await apiClient.patch(`/cart/items/${productId}`, { quantity });
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
