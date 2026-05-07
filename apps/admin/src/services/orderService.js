import apiClient from "./apiClient";

export async function getAdminOrders(params = {}) {
  const { data } = await apiClient.get("/orders/admin/all", { params });
  return data?.data?.orders ?? [];
}

export async function getAdminOrderById(id) {
  const { data } = await apiClient.get(`/orders/admin/${id}`);
  return data?.data?.order;
}

export async function updateAdminOrderStatus(id, orderStatus) {
  const { data } = await apiClient.patch(`/orders/admin/${id}/status`, { orderStatus });
  return data?.data?.order;
}

export async function updateAdminOrderPaymentStatus(id, paymentStatus, notes = "") {
  const payload = notes ? { paymentStatus, notes } : { paymentStatus };
  const { data } = await apiClient.patch(`/orders/admin/${id}/payment-status`, payload);
  return data?.data?.order;
}
