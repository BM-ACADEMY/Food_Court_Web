
import React from "react";
import Home from "@/Modules/User/pages/Landing/Home";
import Mainpage from "@/Modules/User/pages/UserDasboardpage/Main/Mainpage";
import RestaurantMain from "@/Modules/Restaurant/pages/main/RestaurantMain";
import DeductRefund from "@/Modules/Restaurant/pages/DeductRefund";
import TransactionDashboard from "@/Modules/Restaurant/pages/History";

// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MasterAdminRoutes from "@/routes/masterAdmin";
// import CustomerRoutes from "@/routes/CustomerRoutes";
// import AdminRoutes from "@/routes/AdminRoutes";
// import RestaurantRoutes from "@/routes/RestaurantRoutes";
// import TreasuryRoutes from "@/routes/TreasuryRoutes";
import "./App.css"
function App() {
  const user = { role: "masteradmin" }; // Replace with actual auth logic


  return (

    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/userdashboard" element={<Mainpage />} />

      {/* Parent Route with shared layout */}
      <Route path="/restaurant" element={<RestaurantMain />}>
        <Route index element={<></>} />
        <Route path="deduct" element={<DeductRefund />} />
        <Route path="history" element={<TransactionDashboard/>}/>
      </Route>
    </Routes>
  );
};

export default App;

