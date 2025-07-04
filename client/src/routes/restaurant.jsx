import { Routes, Route } from "react-router-dom";
import RestaurantLayout from "./RestaurantLayout";
import RestaurantDashboard from "@/Modules/Restaurant/pages/RestaurantHome";
import DeductRefund from "@/Modules/Restaurant/pages/DeductRefund";
import TransactionDashboard from "@/Modules/Restaurant/pages/History";
import QrCodePage from "@/Modules/Restaurant/pages/QrCodePage";

export default function RestaurantRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RestaurantLayout />}>
        <Route index element={<RestaurantDashboard />} />
        <Route path="deduct-refund" element={<DeductRefund />} />
        <Route path="history" element={<TransactionDashboard />} />
        <Route path="qrcode" element={<QrCodePage />} />
      </Route>
    </Routes>
  );
}