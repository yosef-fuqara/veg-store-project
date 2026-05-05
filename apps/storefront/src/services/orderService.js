import apiClient from "./apiClient";

export const createOrder = async (payload) => {
  const { data } = await apiClient.post("/orders", payload);
  return data.data.order;
};

export const getOrder = async (id) => {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data.data.order;
};
