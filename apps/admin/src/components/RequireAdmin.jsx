import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { USER_ROLES } from "../constants/roles";

const RequireAdmin = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== USER_ROLES.ADMIN) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RequireAdmin;
