import React from "react";
import { Routes, Route } from "react-router-dom";
import RestaurantHeader from "@/Modules/Restaurant/components/Header/Navbar";
import RestaurantDashboard from "@/Modules/Restaurant/pages/RestaurantHome";
import DeductRefund from "@/Modules/Restaurant/pages/DeductRefund";
import TransactionDashboard from "@/Modules/Restaurant/pages/History";
import Footer from "@/Modules/Restaurant/components/Footer/Footer";

const Restaurant = () => {
  return (
    <div>
      <RestaurantHeader />

      <Routes>
        <Route path="/" element={<RestaurantDashboard />} />
        <Route path="/deduct-refund" element={<DeductRefund />} />
        <Route path="/history" element={<TransactionDashboard />} />
      </Routes>

      <Footer />
    </div>
  );
};

export default Restaurant;
