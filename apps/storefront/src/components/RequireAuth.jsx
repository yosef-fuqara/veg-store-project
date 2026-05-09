import { Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../features/auth/AuthContext";

const RequireAuth = ({ children }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();
  const { t } = useTranslation("common");

  if (initializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }} aria-label={t("loading")}>
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          style={{ width: '8px', height: '8px', borderRadius: '9999px', background: '#1e6b3c', display: 'block' }}
        />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
};

export default RequireAuth;
