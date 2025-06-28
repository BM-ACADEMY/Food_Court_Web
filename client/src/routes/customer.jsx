import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/Modules/User/pages/Landing/Home";
import Mainpage from "@/Modules/User/pages/UserDasboardpage/Main/Mainpage";
import { useAuth } from "@/context/AuthContext";


export default function CustomerRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Redirect authenticated customers to userdashboard */}
      {user && user.role.name === "Customer" ? (
        <Route path="/" element={<Navigate to="/customer/userdashboard" replace />} />
      ) : (
        <Route path="/" element={<Home />} />
      )}
      <Route path="userdashboard" element={<Mainpage />} />
     
    </Routes>
  );
}