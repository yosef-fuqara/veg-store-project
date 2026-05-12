import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../features/auth/AuthContext";

const RequireAuth = ({ children }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();
  const { t } = useTranslation("nav");

  if (initializing) {
    return <p>{t("loadingSession")}</p>;
  }

  if (!user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
};

export default RequireAuth;
