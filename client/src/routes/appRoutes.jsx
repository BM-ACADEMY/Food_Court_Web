// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import CustomerRoutes from "./CustomerRoutes";
import TreasuryRoutes from "./TreasuryRoutes";
import RestaurantRoutes from "./RestaurantRoutes";
import AdminRoutes from "./AdminRoutes";
import MasterAdminRoutes from "./masterAdmin";
// import Login from "@/pages/login/Login";
// import NotFound from "@/pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      {/* <Route path="/login" element={<Login />} /> */}
      
      {/* <Route path="/customer/*" element={<CustomerRoutes />} />
      <Route path="/treasury/*" element={<TreasuryRoutes />} />
      <Route path="/restaurant/*" element={<RestaurantRoutes />} />
      <Route path="/admin/*" element={<AdminRoutes />} /> */}
      <Route path="/master-admin/*" element={<MasterAdminRoutes />} />
      
      {/* <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}
