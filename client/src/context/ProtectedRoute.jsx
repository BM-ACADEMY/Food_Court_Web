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

  // Debug: Log role check
  console.log('ProtectedRoute: user role=', user?.role?.name, 'allowedRole=', allowedRole, 'pathname=', location.pathname);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    console.log('No user, redirecting to /login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role.name !== allowedRole) {
    const redirectPath = roleRoutes[user.role.name] || "/login";
    console.log(`Role mismatch, redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children;
}