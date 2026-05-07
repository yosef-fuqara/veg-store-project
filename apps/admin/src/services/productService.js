import apiClient from "./apiClient";

export async function getAdminProducts() {
  const { data } = await apiClient.get("/products/admin/all");
  return data?.data?.products ?? [];
}

export async function createProduct(payload) {
  const { data } = await apiClient.post("/products", payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data?.data?.product;
}

export async function updateProduct(id, payload) {
  const { data } = await apiClient.patch(`/products/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data?.data?.product;
}

export async function setProductFrozen(id, isFrozen) {
  const { data } = await apiClient.patch(`/products/${id}/freeze`, { isFrozen });
  return data?.data?.product;
}

export async function deleteProduct(id) {
  const { data } = await apiClient.delete(`/products/${id}`);
  return data?.data?.product;
}
