import apiClient from "./apiClient";

/**
 * @param {object} payload order fields (same shape as JSON body)
 * @param {{ bankTransferProofFile?: File | null }} [options] optional screenshot for bank transfer (multipart)
 */
export const createOrder = async (payload, options = {}) => {
  const file = options.bankTransferProofFile;
  if (file) {
    const formData = new FormData();
    formData.append("deliveryAddress", JSON.stringify(payload.deliveryAddress));
    formData.append("deliveryArea", payload.deliveryArea);
    formData.append("customerPhone", payload.customerPhone ?? "");
    formData.append("notes", payload.notes ?? "");
    formData.append("paymentMethod", payload.paymentMethod);
    if (payload.preferredDeliveryAt) {
      formData.append("preferredDeliveryAt", payload.preferredDeliveryAt);
    }
    if (payload.customRequest) {
      formData.append("customRequest", payload.customRequest);
    }
    appendConsentFields(formData, payload);
    formData.append("bankTransferProof", file);
    const { data } = await apiClient.post("/orders", formData);
    return data.data.order;
  }
  const { data } = await apiClient.post("/orders", payload);
  return data.data.order;
};

/** Append checkout consent fields to a multipart form (booleans as strings). */
const appendConsentFields = (formData, payload) => {
  if (payload.acceptTerms === true) {
    formData.append("acceptTerms", "true");
  }
  if (payload.marketingConsent === true) {
    formData.append("marketingConsent", "true");
  }
  if (payload.saveDetailsConsent === true) {
    formData.append("saveDetailsConsent", "true");
  }
  if (payload.joinCustomerClub === true) {
    formData.append("joinCustomerClub", "true");
  }
  if (payload.consentLanguage) {
    formData.append("consentLanguage", payload.consentLanguage);
  }
};

export const getOrder = async (id) => {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data.data.order;
};

export const getOrders = async () => {
  const { data } = await apiClient.get("/orders");
  return data.data.orders;
};

export const getDeliveryAreas = async () => {
  const { data } = await apiClient.get("/orders/delivery-areas");
  return data.data;
};

export const guestCheckoutPreview = async (items) => {
  const { data } = await apiClient.post("/orders/guest/preview", { items });
  return data.data.checkout;
};

/**
 * @param {object} payload guest order fields including `items`
 * @param {{ bankTransferProofFile?: File | null }} [options]
 */
export const createGuestOrder = async (payload, options = {}) => {
  const file = options.bankTransferProofFile;
  if (file) {
    const formData = new FormData();
    formData.append("items", JSON.stringify(payload.items));
    formData.append("customerName", payload.customerName ?? "");
    if (payload.customerEmail) formData.append("customerEmail", payload.customerEmail);
    formData.append("deliveryAddress", JSON.stringify(payload.deliveryAddress));
    formData.append("deliveryArea", payload.deliveryArea);
    formData.append("customerPhone", payload.customerPhone ?? "");
    formData.append("notes", payload.notes ?? "");
    formData.append("paymentMethod", payload.paymentMethod);
    if (payload.preferredDeliveryAt) {
      formData.append("preferredDeliveryAt", payload.preferredDeliveryAt);
    }
    if (payload.customRequest) {
      formData.append("customRequest", payload.customRequest);
    }
    appendConsentFields(formData, payload);
    formData.append("bankTransferProof", file);
    const { data } = await apiClient.post("/orders/guest", formData);
    return data.data.order;
  }
  const { data } = await apiClient.post("/orders/guest", payload);
  return data.data.order;
};
