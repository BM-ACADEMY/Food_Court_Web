// src/routes/customer.tsx
import { Routes, Route } from "react-router-dom";
import Home from "@/Modules/User/pages/Landing/Home";
import Mainpage from "@/Modules/User/pages/UserDasboardpage/Main/Mainpage";

export default function CustomerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="userdashboard" element={<Mainpage />} />
    </Routes>
  );
}
