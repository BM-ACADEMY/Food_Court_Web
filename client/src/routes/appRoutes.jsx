// // AppRoutes.tsx
// import { Routes, Route, Navigate, useLocation } from "react-router-dom";
// // import Login from "@/pages/login/Login";
// import NotFound from "@/Modules/Notfound";
// import CustomerRoutes from "./customer";
// import TreasuryRoutes from "./treasury";
// import RestaurantRoutes from "./restaurant";
// // import AdminRoutes from "./AdminRoutes";
// import MasterAdminRoutes from "./masterAdmin";


// export default function AppRoutes() {
//   // const user = JSON.parse(localStorage.getItem("user")) || null; 

//   const user={role:"masteradmin"}
//   // const user={role:"treasury"}

//   // const user = { role: "customer" }
//   // const user={role:"restaurant"}

//   const location = useLocation();

//   // User is not logged in and not on /login
//   if (!user && location.pathname !== "/login") {
//     return <Navigate to="/login" replace />;
//   }

//   // Redirect to role-based home page
//   if (user && location.pathname === "/") {
//     switch (user.role) {
//       case "masteradmin":
//         return <Navigate to="/master-admin" replace />;
//       case "admin":
//         return <Navigate to="/admin" replace />;
//       case "customer":
//         return <Navigate to="/customer" replace />;
//       case "restaurant":
//         return <Navigate to="/restaurant" replace />;
//       case "treasury":
//         return <Navigate to="/treasury" replace />;
//       default:
//         return <Navigate to="/login" replace />;
//     }
//   }

//   return (
//     <Routes>
//       {/* <Route path="/login" element={<Login />} /> */}
//       <Route path="/master-admin/*" element={<MasterAdminRoutes />} />
//       {/* <Route path="/admin/*" element={<AdminRoutes />} /> */}
//       <Route path="/customer/*" element={<CustomerRoutes />} />
//       <Route path="/restaurant/*" element={<RestaurantRoutes />} />
//       <Route path="/treasury/*" element={<TreasuryRoutes />} />
//       <Route path="*" element={<NotFound />} />
//       {/* <Route path="/restaurant/*" element={<Restaurant />} /> */}
//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   );
// }
















import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Login from "@/Modules/User/pages/Landing/Home";
import NotFound from "@/Modules/Notfound";
import CustomerRoutes from "./customer";
import TreasuryRoutes from "./treasury";
import RestaurantRoutes from "./restaurant";
import MasterAdminRoutes from "./masterAdmin";
import { ProtectedRoute } from "@/context/ProtectedRoute";

export default function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  // If user is logged in and on "/", redirect them based on role
  if (user && location.pathname === "/") {
    switch (user.role.name) {
      case "Master-Admin":
        return <Navigate to="/master-admin" replace />;
      case "Admin":
        return <Navigate to="/admin" replace />;
      case "Customer":
        return <Navigate to="/customer" replace />;
      case "Restaurant":
        return <Navigate to="/restaurant" replace />;
      case "Treasury-Subcom":
        return <Navigate to="/treasury" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Prevent redirect to /login if already logged in
  if (user && location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/master-admin/*"
        element={
          <ProtectedRoute allowedRole="Master-Admin">
            <MasterAdminRoutes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/*"
        element={
          <ProtectedRoute allowedRole="Customer">
            <CustomerRoutes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/restaurant/*"
        element={
          <ProtectedRoute allowedRole="Restaurant">
            <RestaurantRoutes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/treasury/*"
        element={
          <ProtectedRoute allowedRole="Treasury-Subcom">
            <TreasuryRoutes />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
