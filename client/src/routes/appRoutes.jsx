
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import MasterAdminRoutes from "./masterAdmin";
import CustomerRoutes from "./customer";
import RestaurantRoutes from "./restaurant";
import TreasuryRoutes from "./treasury";
import AdminRoutes from "./adminRoute";
import Login from "@/Modules/User/pages/Landing/Home";
import { ProtectedRoute } from "@/context/ProtectedRoute";
// import NotFound from "@/Modules/NotFound";

export default function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  // Redirect logged-in user away from / or /login
  if (user && (location.pathname === "/" || location.pathname === "/login")) {

    switch (user.role.role_id) {
      case "role-1": return <Navigate to="/master-admin" replace />;
      case "role-2": return <Navigate to="/admin" replace />;
      case "role-3": return <Navigate to="/treasury" replace />;
      case "role-4": return <Navigate to="/restaurant" replace />;
      case "role-5": return <Navigate to="/customer/userdashboard" replace />;
      default: return <Navigate to="/login" replace />;


    }
  }

  return (
    <Routes>



      {/* Public routes for unauthenticated users */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Login />} />
      {/* Protected routes */}

      <Route
        path="/master-admin/*"
        element={
          <ProtectedRoute allowedRole="role-1">
            <MasterAdminRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRole="role-2">
            <AdminRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/*"
        element={
          <ProtectedRoute allowedRole="role-5">
            <CustomerRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/*"
        element={
          <ProtectedRoute allowedRole="role-4">
            <RestaurantRoutes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/treasury/*"
        element={
          <ProtectedRoute allowedRole="role-3">
            <TreasuryRoutes />
          </ProtectedRoute>
        }
      />


      {/* Catch-all for unknown routes */}

      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}

