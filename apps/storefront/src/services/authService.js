import apiClient from "./apiClient";

export const login = async ({ email, password }) => {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return {
    user: data.data.user,
    accessToken: data.data.tokens.accessToken
  };
};

export const register = async ({
  name,
  phone,
  email,
  password,
  acceptTerms,
  marketingConsent,
  marketingConsentWhatsApp,
  saveDetailsConsent,
  joinCustomerClub,
  consentLanguage
}) => {
  const marketing = marketingConsent === true || marketingConsentWhatsApp === true;
  const body = {
    name,
    phone,
    email,
    password,
    acceptTerms: acceptTerms === true,
    marketingConsent: marketing,
    marketingConsentWhatsApp: marketing,
    saveDetailsConsent: saveDetailsConsent === true,
    joinCustomerClub: joinCustomerClub === true
  };
  if (consentLanguage) {
    body.consentLanguage = consentLanguage;
  }
  const { data } = await apiClient.post("/auth/register", body);
  return {
    user: data.data.user,
    accessToken: data.data.tokens.accessToken
  };
};

export const me = async () => {
  const { data } = await apiClient.get("/auth/me");
  return data.data.user;
};

export const forgotPassword = async ({ email }) => {
  const { data } = await apiClient.post("/auth/forgot-password", { email });
  return data;
};

export const resetPassword = async ({ token, newPassword }) => {
  const { data } = await apiClient.post("/auth/reset-password", { token, newPassword });
  return data;
};
