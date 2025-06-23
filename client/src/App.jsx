
// import React from "react";
// import { Routes, Route } from "react-router-dom";

// import Home from "@/Modules/User/pages/Landing/Home";
// import Mainpage from "@/Modules/User/pages/UserDasboardpage/Main/Mainpage";
// import RestaurantMain from "@/Modules/Restaurant/pages/main/RestaurantMain";

// function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<Home />} />
//       <Route path="/userdashboard" element={<Mainpage />} />
//       <Route path="/restaurant/*" element={<RestaurantMain />} />
//     </Routes>
//   );
// }

// export default App;



import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "@/routes/appRoutes";
import { ToastContainer, toast ,Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function App() {
  return (
    <Router>
      <AppRoutes />
       <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Bounce}
      />
    </Router>
  );
}