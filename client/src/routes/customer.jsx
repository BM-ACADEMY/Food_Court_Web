import Home from "@/Modules/User/pages/Landing/Home";
import Mainpage from "@/Modules/User/pages/UserDasboardpage/Main/Mainpage";
import { Routes, Route } from "react-router-dom";


export default function CustomerRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/userdashboard" element={<Mainpage />} />

      </Routes>

    </>
  );
}
