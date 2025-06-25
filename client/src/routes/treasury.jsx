// src/routes/treasury.tsx
import { Routes, Route } from "react-router-dom";
import TreasuryLayout from "./TreasuryLayout";
import Home from "@/Modules/Treasury_subcom/Pages/Home";
import RegisterCustomer from "@/Modules/Treasury_subcom/Pages/RegisterCustomer";
import TopUpOnlineUser from "@/Modules/Treasury_subcom/Pages/TopUpOnlineUser";
import CustomerHistory from "@/Modules/Treasury_subcom/Pages/CustomerHistory";
import RestaurantHistory from "@/Modules/Treasury_subcom/Pages/RestaurantHistory";
import UserHistory from "@/Modules/Treasury_subcom/Pages/UserHistory";
import GenerateQr from "@/Modules/Treasury_subcom/Pages/GenerateQr";

export default function TreasuryRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TreasuryLayout />}>
        <Route index element={<Home />} />
        <Route path="register-customer" element={<RegisterCustomer />} />
        <Route path="topup-online-user" element={<TopUpOnlineUser />} />
        <Route path="customer-history" element={<CustomerHistory />} />
        <Route path="restaurant-history" element={<RestaurantHistory />} />
        <Route path="user-history" element={<UserHistory />} />
        <Route path="generate-qr" element={<GenerateQr />} />
        </Route>
    </Routes>
  );
}
