
// // AppRoutes.tsx
// import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// // src/routes/AppRoutes.tsx
// // import { Routes, Route, Navigate } from "react-router-dom";
// // import CustomerRoutes from "./CustomerRoutes";
// // import TreasuryRoutes from "./TreasuryRoutes";
// // import RestaurantRoutes from "./RestaurantRoutes";
// // import AdminRoutes from "./AdminRoutes";
// // import MasterAdminRoutes from "./masterAdmin";

// // import Login from "@/pages/login/Login";
// // import NotFound from "@/pages/NotFound";
// // import CustomerRoutes from "./CustomerRoutes";
// import TreasuryRoutes from "./treasury";
// // import RestaurantRoutes from "./RestaurantRoutes";
// // import AdminRoutes from "./AdminRoutes";
// import MasterAdminRoutes from "./masterAdmin";

// // export default function AppRoutes() {
// //   return (
// //     <Routes>
// //       <Route path="/login" element={<Login />} />
// //       <Route path="/customer/*" element={<CustomerRoutes />} />
// //       <Route path="/treasury/*" element={<TreasuryRoutes />} />
// //       <Route path="/restaurant/*" element={<RestaurantRoutes />} />
// //       <Route path="/admin/*" element={<AdminRoutes />} />
// //       <Route path="/master-admin/*" element={<MasterAdminRoutes />} />
      
// //       <Route path="/" element={<Navigate to="/login" />} />
// //       <Route path="*" element={<NotFound />} />
// //     </Routes>
// //   );
// // }



// AppRoutes.tsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
// import Login from "@/pages/login/Login";
// import NotFound from "@/pages/NotFound";
// import CustomerRoutes from "./CustomerRoutes";
import TreasuryRoutes from "./treasury";
// import RestaurantRoutes from "./RestaurantRoutes";
// import AdminRoutes from "./AdminRoutes";
import MasterAdminRoutes from "./masterAdmin";

export default function AppRoutes() {
  // const user = JSON.parse(localStorage.getItem("user")) || null; 

  const user={role:"treasury"}

  const location = useLocation();

  // User is not logged in and not on /login
  if (!user && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  // Redirect to role-based home page
  if (user && location.pathname === "/") {
    switch (user.role) {
      case "masteradmin":
        return <Navigate to="/master-admin" replace />;
      case "admin":
        return <Navigate to="/admin" replace />;
      case "customer":
        return <Navigate to="/customer" replace />;
      case "restaurant":
        return <Navigate to="/restaurant" replace />;
      case "treasury":
        return <Navigate to="/treasury" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return (
    <Routes>
      {/* <Route path="/login" element={<Login />} /> */}
      <Route path="/master-admin/*" element={<MasterAdminRoutes />} />

      <Route path="/treasury/*" element={<TreasuryRoutes />} />
      {/* <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/customer/*" element={<CustomerRoutes />} />
      <Route path="/restaurant/*" element={<RestaurantRoutes />} />

      <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}