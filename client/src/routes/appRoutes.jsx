// AppRoutes.tsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
// import Login from "@/pages/login/Login";
// import NotFound from "@/pages/NotFound";

// import TreasuryRoutes from "./treasury";
// import RestaurantRoutes from "./RestaurantRoutes";
// import AdminRoutes from "./AdminRoutes";
import MasterAdminRoutes from "./masterAdmin";
import CustomerRoutes from "./customer";
import Restaurant from "./restaurant";

export default function AppRoutes() {
  // const user = JSON.parse(localStorage.getItem("user")) || null; 
  const user={role:"customer"}
  const location = useLocation();

  // User is not logged in and not on /login
  if (!user && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  // Redirect to role-based home page
  if (user && location.pathname === "/") {
    switch (user.role) {
      case "masteradmin":
        return <Navigate to="/master-admin" replace />;
      case "admin":
        return <Navigate to="/admin" replace />;
      case "customer":
        return <Navigate to="/customer" replace />;
      case "restaurant":
        return <Navigate to="/restaurant" replace />;
      case "treasury":
        return <Navigate to="/treasury" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return (
    <Routes>
      {/* <Route path="/login" element={<Login />} /> */}
      <Route path="/master-admin/*" element={<MasterAdminRoutes />} />
       <Route path="/customer/*" element={<CustomerRoutes />} />
       <Route path="/restaurant/*" element={<Restaurant />} />
      {/* <Route path="/treasury/*" element={<TreasuryRoutes />} /> */}
      {/* <Route path="/admin/*" element={<AdminRoutes />} />
     
      
      <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}