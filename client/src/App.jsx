// src/App.tsx
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import MasterAdminRoutes from "@/routes/masterAdmin";
// import CustomerRoutes from "@/routes/CustomerRoutes";
// import AdminRoutes from "@/routes/AdminRoutes";
// import RestaurantRoutes from "@/routes/RestaurantRoutes";
// import TreasuryRoutes from "@/routes/TreasuryRoutes";
// import "./App.css"
// export default function App() {
//   const user = { role: "masteradmin" }; // Replace with actual auth logic

//   return (
//     <Router>
//       <Routes>
//         {/* Role-based routing */}
//         {user.role === "masteradmin" && (
//           <Route path="/*" element={<MasterAdminRoutes />} />
//         )}
//         {user.role === "customer" && (
//           <Route path="/*" element={<CustomerRoutes />} />
//         )}
//         {user.role === "admin" && (
//           <Route path="/*" element={<AdminRoutes />} />
//         )}
//         {user.role === "restaurant" && (
//           <Route path="/*" element={<RestaurantRoutes />} />
//         )}
//         {user.role === "treasury" && (
//           <Route path="/*" element={<TreasuryRoutes />} />
//         )}

//         {/* Fallback or default redirect */}
//         <Route path="*" element={<Navigate to="/" />} />
//       </Routes>
//     </Router>
//   );
// }
// App.tsx
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "@/routes/appRoutes";

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
