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
    formData.append("bankTransferProof", file);
    const { data } = await apiClient.post("/orders", formData);
    return data.data.order;
  }
  const { data } = await apiClient.post("/orders", payload);
  return data.data.order;
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
