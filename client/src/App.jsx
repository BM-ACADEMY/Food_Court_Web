import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "@/Modules/User/pages/Landing/Home";
import Mainpage from "@/Modules/User/pages/UserDasboardpage/Main/Mainpage";
import RestaurantMain from "@/Modules/Restaurant/pages/main/RestaurantMain";
import DeductRefund from "@/Modules/Restaurant/pages/DeductRefund";
import TransactionDashboard from "@/Modules/Restaurant/pages/History";

const App = () => {
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
