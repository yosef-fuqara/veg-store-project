import apiClient from "./apiClient";

export const updateProfile = async (payload) => {
  const { data } = await apiClient.patch("/auth/me", payload);
  return data.data.user;
};

export const updateMarketingConsent = async (marketingConsentWhatsApp, consentLanguage) => {
  const body = { marketingConsentWhatsApp };
  if (consentLanguage) {
    body.consentLanguage = consentLanguage;
  }
  const { data } = await apiClient.patch("/auth/me/marketing-consent", body);
  return data.data.user;
};

export const joinCustomerClub = async (consentLanguage) => {
  const { data } = await apiClient.post("/auth/me/customer-club", {
    ...(consentLanguage ? { consentLanguage } : {})
  });
  return data.data.user;
};

export const leaveCustomerClub = async () => {
  const { data } = await apiClient.delete("/auth/me/customer-club");
  return data.data.user;
};

export const updateSavedDetailsConsent = async (saveForNextOrder) => {
  const { data } = await apiClient.patch("/auth/me/saved-details", { saveForNextOrder });
  return data.data.user;
};

export const deleteSavedDeliveryDetails = async () => {
  const { data } = await apiClient.delete("/auth/me/saved-details");
  return data.data.user;
};

export const requestAccountDeletion = async () => {
  const { data } = await apiClient.post("/auth/me/deletion-request");
  return data;
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
