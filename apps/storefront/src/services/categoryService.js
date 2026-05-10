import apiClient from "./apiClient";

/**
 * Public storefront categories (active, not frozen/deleted).
 * @returns {Promise<Array<{ _id: string, slug: string, name?: unknown }>>}
 */
export async function getCategories() {
  const { data } = await apiClient.get("/categories");
  return data?.data?.categories ?? [];
}
