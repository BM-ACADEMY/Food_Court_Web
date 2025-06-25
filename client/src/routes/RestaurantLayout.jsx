// src/layouts/RestaurantLayout.tsx
import { Outlet } from "react-router-dom";
import RestaurantHeader from "@/Modules/Restaurant/components/Header/Navbar";
import Footer from "@/Modules/Restaurant/components/Footer/Footer";

export default function RestaurantLayout() {
  return (
    <>
      <RestaurantHeader />
      <Outlet />
      <Footer />
    </>
  );
}
