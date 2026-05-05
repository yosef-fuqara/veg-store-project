import apiClient from "./apiClient";

export const login = async ({ email, password }) => {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return {
    user: data.data.user,
    accessToken: data.data.tokens.accessToken
  };
};

export const register = async ({ name, phone, email, password }) => {
  const { data } = await apiClient.post("/auth/register", {
    name,
    phone,
    email,
    password
  });
  return {
    user: data.data.user,
    accessToken: data.data.tokens.accessToken
  };
};

export const me = async () => {
  const { data } = await apiClient.get("/auth/me");
  return data.data.user;
};
