import { Routes, Route } from "react-router-dom";
import ModuleLayout from "./moduleRoute";
import Dashboard from "@/Modules/Admin/pages/dashboard/Dashboard";
import TransactionHistory from "@/Modules/Admin/pages/transaction/TransactionPage";
import CustomerList from "@/Modules/Admin/pages/customer/customerList";
import TreasurySubcomList from "@/Modules/Admin/pages/treasurySubcom/TreasurySubcom";
import RestaurantList from "@/Modules/Admin/pages/restaurant/RestaurantList";
import AdminList from "@/Modules/Admin/pages/admin/AdminList";
import SessionHistory from "@/Modules/Admin/pages/account/SessionHistory";
import { LocationManager } from "@/Modules/Admin/pages/locations/locationPage";
import { UpiManager } from "@/Modules/Admin/pages/upi/UpiPage";
import GenerateQr from "@/Modules/Admin/pages/offlineQrcode/OfflineQrcode";
import PointExchange from "@/Modules/Admin/pages/points/PointExchange";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ModuleLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="transaction-history" element={<TransactionHistory />} />  
        <Route path="customers/customer-list" element={<CustomerList />} />  
        <Route path="treasury-subcom/treasury-subcom-list" element={<TreasurySubcomList />} />  
        <Route path="restaurant/restaurant-list" element={<RestaurantList />} />  
        <Route path="admin/admin-list" element={<AdminList />} />  
         <Route path="points/point-exchange" element={<PointExchange />} />
        <Route path="history" element={<SessionHistory />} />  
        <Route path="locations" element={<LocationManager />} />  
        <Route path="upi" element={<UpiManager />} />  
        <Route path="qrcode" element={<GenerateQr />} />  
      </Route>
    </Routes>
  );
}