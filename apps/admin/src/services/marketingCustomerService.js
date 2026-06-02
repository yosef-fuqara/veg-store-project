import apiClient from "./apiClient";

export async function getMarketingCustomers() {
  const { data } = await apiClient.get("/admin/marketing-customers");
  return data?.data?.customers ?? [];
}
