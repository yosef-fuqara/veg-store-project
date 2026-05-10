import apiClient from "./apiClient";

export async function getAdminCategories() {
  const { data } = await apiClient.get("/categories/admin/all");
  return data?.data?.categories ?? [];
}

/**
 * @param {{ name: string, description?: string, isActive?: boolean, isFrozen?: boolean }} payload
 */
export async function createCategory(payload) {
  const { data } = await apiClient.post("/categories", payload);
  return data?.data?.category;
}

/** Soft-deletes the category (API sets isDeleted / frozen; products stay linked but hide from storefront). */
export async function softDeleteCategory(id) {
  const { data } = await apiClient.delete(`/categories/${id}`);
  return data?.data?.category;
}
