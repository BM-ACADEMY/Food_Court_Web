import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from '@/Modules/User/pages/Landing/Home';
import Footer from '@/Modules/User/components/footer/Footer';
import Mainpage from "@/Modules/User/pages/UserDasboardpage/Main/Mainpage";



const App = () => {
  return (
    <>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path='/userdashboard' element={<Mainpage/>}/>
      </Routes>
      <Footer />
    </>
  );
};

export default App;

