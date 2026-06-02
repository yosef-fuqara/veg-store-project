import apiClient from "./apiClient";

export const updateProfile = async (payload) => {
  const { data } = await apiClient.patch("/auth/me", payload);
  return data.data.user;
};

export const updateMarketingConsent = async (marketingConsentWhatsApp) => {
  const { data } = await apiClient.patch("/auth/me/marketing-consent", {
    marketingConsentWhatsApp
  });
  return data.data.user;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await apiClient.patch("/auth/me/password", {
    currentPassword,
    newPassword
  });
  return data;
};

export const createAddress = async (address) => {
  const { data } = await apiClient.post("/auth/me/addresses", address);
  return data.data.user;
};

export const updateAddress = async (addressId, address) => {
  const { data } = await apiClient.patch(`/auth/me/addresses/${addressId}`, address);
  return data.data.user;
};

export const deleteAddress = async (addressId) => {
  const { data } = await apiClient.delete(`/auth/me/addresses/${addressId}`);
  return data.data.user;
};

export const setDefaultAddress = async (addressId) => {
  const { data } = await apiClient.patch(`/auth/me/addresses/${addressId}/default`);
  return data.data.user;
};

export const getFavoriteProducts = async () => {
  const { data } = await apiClient.get("/auth/me/favorites");
  return data.data.products ?? [];
};

export const addFavorite = async (productId) => {
  const { data } = await apiClient.post(`/auth/me/favorites/${productId}`);
  return data.data.user;
};

export const removeFavorite = async (productId) => {
  const { data } = await apiClient.delete(`/auth/me/favorites/${productId}`);
  return data.data.user;
};
