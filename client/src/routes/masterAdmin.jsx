import { Routes, Route } from "react-router-dom";
import ModuleLayout from "./moduleRoute";
import Dashboard from "@/Modules/Master-admin/pages/Dashboard";
import TransactionHistory from "@/Modules/Master-admin/pages/TransactionPage";
import CustomerList from "@/Modules/Master-admin/pages/customer/customerList";
import TreasurySubcomList from "@/Modules/Master-admin/pages/treasurySubcom/TreasurySubcom";
import RestaurantList from "@/Modules/Master-admin/pages/restaurant/RestaurantList";
import AdminList from "@/Modules/Master-admin/pages/admin/AdminList";
import PointExchange from "@/Modules/Master-admin/pages/points/PointExchange";
import AddDeleteAccess from "@/Modules/Master-admin/pages/users/AddDeleteAccess";
import SessionHistory from "@/Modules/Master-admin/pages/account/SessionHistory";
import { LocationManager } from "@/Modules/Master-admin/pages/locations/LocationPage";
import { UpiManager } from "@/Modules/Master-admin/pages/upi/UpiPage";
import FeesTable from "@/Modules/Master-admin/pages/Fees/FeesTable";

export default function MasterAdminRoutes() {
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
        <Route path="adddelete/add-new-user" element={<AddDeleteAccess />} />
        <Route path="history" element={<SessionHistory />} />
        <Route path="locations" element={<LocationManager />} />
        <Route path="fees" element={<FeesTable />} />
        <Route path="upi" element={<UpiManager />} />
      </Route>
    </Routes>
  );
}
