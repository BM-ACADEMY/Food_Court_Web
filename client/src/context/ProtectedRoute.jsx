// components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const roleRoutes = {
  "Master-Admin": "/master-admin",
  "Admin": "/admin",
  "Customer": "/customer",
  "Restaurant": "/restaurant",
  "Treasury-Subcom": "/treasury",
};

export function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    // No user → go to login
    return <Navigate to="/login" replace />;
  }

  if (user.role.name !== allowedRole) {
    // Logged in but trying to access the wrong panel
    const redirectPath = roleRoutes[user.role.name] || "/login";
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children;
}
