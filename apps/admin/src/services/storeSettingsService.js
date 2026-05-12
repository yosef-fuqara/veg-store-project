import apiClient from "./apiClient";

export async function getStoreSettings() {
  const { data } = await apiClient.get("/admin/store-settings");
  return data?.data?.settings;
}

/**
 * @param {object} patch
 */
export async function patchStoreSettings(patch) {
  const { data } = await apiClient.patch("/admin/store-settings", patch);
  return data?.data?.settings;
}
