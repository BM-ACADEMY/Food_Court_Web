


import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";


// Redirection paths by role_id
const roleRoutes = {
  "role-1": "/master-admin",
  "role-2": "/admin",
  "role-3": "/treasury",
  "role-4": "/restaurant",
  "role-5": "/customer",
};

export function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role.role_id !== allowedRole) {

    
    const redirectPath = roleRoutes[user.role.role_id] || "/login";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
