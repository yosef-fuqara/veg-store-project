import apiClient from "./apiClient";

/**
 * @returns {Promise<null | {
 *   id: string;
 *   title: string;
 *   message: string;
 *   imageUrl: string;
 *   buttonText: string;
 *   buttonLink: string;
 *   startsAt: string;
 *   endsAt: string;
 * }>}
 */
export async function getActiveAnnouncement() {
  const { data } = await apiClient.get("/announcements/active");
  return data?.data?.announcement ?? null;
}
