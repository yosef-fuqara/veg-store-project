import apiClient from "./apiClient";

export async function getMarketingRecipientsCount() {
  const { data } = await apiClient.get("/admin/marketing/recipients/count");
  return Number(data?.data?.recipientCount || 0);
}

export async function previewMarketingCampaign(payload) {
  const { data } = await apiClient.post("/admin/marketing/campaigns/preview", payload);
  return data?.data;
}

export async function sendMarketingCampaign(payload) {
  const { data } = await apiClient.post("/admin/marketing/campaigns/send", payload);
  return data?.data?.campaign;
}
