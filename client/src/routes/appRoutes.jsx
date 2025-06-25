import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import MasterAdminRoutes from "./masterAdmin";
import CustomerRoutes from "./customer";
import RestaurantRoutes from "./restaurant";
import TreasuryRoutes from "./treasury";
import AdminRoutes from "./adminRoute";
import Login from "@/Modules/User/pages/Landing/Home";
import { ProtectedRoute } from "@/context/ProtectedRoute";
import NotFound from "@/Modules/NotFound";

export default function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Debug: Log user, role, and current path
  console.log('AppRoutes: user=', user, 'role=', user?.role?.name, 'loading=', loading, 'pathname=', location.pathname);

  if (loading) return <div>Loading...</div>;

  // Redirect authenticated users from root or login to their dashboard
  if (user && (location.pathname === "/" || location.pathname === "/login")) {
    switch (user.role.name) {
      case "Master-Admin":
        return <Navigate to="/master-admin" replace />;
      case "Admin":
        return <Navigate to="/admin" replace />;
      case "Customer":
        return <Navigate to="/customer/userdashboard" replace />; // Direct to dashboard
      case "Restaurant":
        return <Navigate to="/restaurant" replace />;
      case "Treasury-Subcom":
        return <Navigate to="/treasury" replace />;
      default:
        console.log('Unknown role, redirecting to /login');
        return <Navigate to="/login" replace />;
    }
  }

  return (
    <Routes>
      {/* Public routes for unauthenticated users */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route
        path="/master-admin/*"
        element={
          <ProtectedRoute allowedRole="Master-Admin">
            <MasterAdminRoutes />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRole="Admin">
            <AdminRoutes />
          </ProtectedRoute>
        }
      />

      {/* Customer Routes */}
      <Route
        path="/customer/*"
        element={
          <ProtectedRoute allowedRole="Customer">
            <CustomerRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/*"
        element={
          <ProtectedRoute allowedRole="Restaurant">
            <RestaurantRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/treasury/*"
        element={
          <ProtectedRoute allowedRole="Treasury-Subcom">
            <TreasuryRoutes />
          </ProtectedRoute>
        }
      />

      {/* Catch-all for unknown routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

