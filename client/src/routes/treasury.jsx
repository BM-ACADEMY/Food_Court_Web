// TreasuryRoutes.tsx
import { Routes, Route } from "react-router-dom";
import Header from "@/Modules/Treasury_subcom/components/header/Navbar";
import Footer from "@/Modules/Treasury_subcom/components/footer/Footer";
import Home from "@/Modules/Treasury_subcom/Pages/Home";
import RegisterCustomer from "@/Modules/Treasury_subcom/Pages/RegisterCustomer";
import TopUpOnlineUser from "@/Modules/Treasury_subcom/Pages/TopUpOnlineUser";
import CustomerHistory from "@/Modules/Treasury_subcom/Pages/CustomerHistory";
import RestaurantHistory from "@/Modules/Treasury_subcom/Pages/RestaurantHistory";
import UserHistory from "@/Modules/Treasury_subcom/Pages/UserHistory";
import GenerateQr from "@/Modules/Treasury_subcom/Pages/GenerateQr";

export default function TreasuryRoutes() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="register-customer" element={<RegisterCustomer />} />
        <Route path="topup-online-user" element={<TopUpOnlineUser />} />
        <Route path="customer-history" element={<CustomerHistory />} />
        <Route path="restaurant-history" element={<RestaurantHistory />} />
        <Route path="user-history" element={<UserHistory />} />
        <Route path="generate-qr" element={<GenerateQr />} />
      </Routes>
      <Footer />
    </>
  );
}
