import apiClient from "./apiClient";

/**
 * Public unsubscribe from marketing messages by phone and/or email.
 * Service/order messages are unaffected.
 */
export const unsubscribe = async ({ phone, email } = {}) => {
  const payload = {};
  if (phone) payload.phone = phone;
  if (email) payload.email = email;
  const { data } = await apiClient.post("/unsubscribe", payload);
  return data;
};
