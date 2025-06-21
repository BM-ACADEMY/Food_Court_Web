// src/routes/MasterAdminRoutes.tsx
import { Routes, Route } from "react-router-dom";
import Dashboard from "@/Modules/Master-admin/pages/Dashboard";
import ModuleLayout from "@/routes/moduleRoute";
import TransactionHistory from "@/Modules/Master-admin/pages/TransactionPage";
import CustomerList from "@/Modules/Master-admin/pages/customer/customerList";
import TreasurySubcomList from "@/Modules/Master-admin/pages/treasurySubcom/TreasurySubcom";
import RestaurantList from "@/Modules/Master-admin/pages/restaurant/RestaurantList";
import AdminList from "@/Modules/Master-admin/pages/admin/AdminList";
import PointExchange from "@/Modules/Master-admin/pages/points/PointExchange";
import AddDeleteAccess from "@/Modules/Master-admin/pages/users/AddDeleteAccess";

export default function MasterAdminRoutes() {
  return (
    <ModuleLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transaction-history" element={<TransactionHistory />} />
        <Route path="/customers/customer-list" element={<CustomerList />} />
        <Route path="/treasury-subcom/treasury-subcom-list" element={<TreasurySubcomList />} />
        <Route path="/restaurant/restaurant-list" element={<RestaurantList />} />
        <Route path="/admin/admin-list" element={<AdminList />} />
        <Route path="/points/point-exchange" element={<PointExchange />} />
        <Route path="/adddelete/add-new-user" element={<AddDeleteAccess />} />

        {/* Add more master admin specific routes here */}
      </Routes>
    </ModuleLayout>
  );
}
