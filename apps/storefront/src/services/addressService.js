import apiClient from "./apiClient";

/**
 * City autocomplete — backed by API delivery-area catalog.
 */

export async function searchCities(query, language, { restrictToDeliveryAreas = true } = {}) {
  const { data } = await apiClient.get("/address/cities", {
    params: {
      q: query || "",
      lang: language || "he",
      restrict: restrictToDeliveryAreas ? "true" : "false"
    }
  });
  return data?.data?.cities ?? [];
}
