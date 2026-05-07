import apiClient from "./apiClient";

export async function getAdminCategories() {
  const { data } = await apiClient.get("/categories/admin/all");
  return data?.data?.categories ?? [];
}
