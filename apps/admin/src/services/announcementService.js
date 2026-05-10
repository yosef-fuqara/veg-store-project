import apiClient from "./apiClient";

/**
 * @param {{ includeArchived?: boolean }} [options]
 */
export async function listAnnouncements(options = {}) {
  const params = options.includeArchived ? { includeArchived: "true" } : {};
  const { data } = await apiClient.get("/announcements", { params });
  return data?.data?.announcements ?? [];
}

/**
 * @param {FormData} formData — multipart fields + optional `image` file
 */
export async function createAnnouncement(formData) {
  const { data } = await apiClient.post("/announcements", formData);
  return data?.data?.announcement;
}

/**
 * @param {string} id
 * @param {FormData} formData — multipart fields + optional `image` file or `removeImage`
 */
export async function updateAnnouncement(id, formData) {
  const { data } = await apiClient.patch(`/announcements/${id}`, formData);
  return data?.data?.announcement;
}

/**
 * @param {string} id
 * @param {boolean} isActive
 */
export async function setAnnouncementActive(id, isActive) {
  const { data } = await apiClient.patch(`/announcements/${id}/active`, { isActive });
  return data?.data?.announcement;
}

/**
 * @param {string} id
 */
export async function archiveAnnouncement(id) {
  const { data } = await apiClient.patch(`/announcements/${id}/archive`);
  return data?.data?.announcement;
}

/**
 * @param {string} id
 */
export async function deleteAnnouncement(id) {
  const { data } = await apiClient.delete(`/announcements/${id}`);
  return data?.data?.deletedId;
}
