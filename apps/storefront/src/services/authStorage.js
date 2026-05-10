const ACCESS_TOKEN_KEY = "accessToken";

/** Fired when an authenticated API call returns 401 so AuthContext can drop stale `user`. */
export const AUTH_SESSION_EXPIRED_EVENT = "vegstore:auth-session-expired";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const setAccessToken = (token) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};
