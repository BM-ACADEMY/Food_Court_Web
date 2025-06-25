// src/layouts/TreasuryLayout.tsx
import { Outlet } from "react-router-dom";
import Header from "@/Modules/Treasury_subcom/components/header/Navbar";
import Footer from "@/Modules/Treasury_subcom/components/footer/Footer";

export default function TreasuryLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
