import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const RequireAuth = ({ children }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <p>Loading session...</p>;
  }

  if (!user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
};

export default RequireAuth;
