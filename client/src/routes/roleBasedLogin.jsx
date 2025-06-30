// src/Modules/User/pages/Landing/RoleBasedLogin.jsx
import { useParams } from "react-router-dom";
import AdminLoginForm from "@/Modules/User/pages/Loginpage/Login";
import LoginForm from "@/Modules/User/pages/Loginpage/AdminLoginPage";
// import RestaurantLogin from "./RestaurantLogin";
// import TreasuryLogin from "./TreasuryLogin";

export default function RoleBasedLogin() {
  const { type } = useParams();

  switch (type) {
    case "admin":
      return <AdminLoginForm />;
    case "customer":
      return <LoginForm />;
    default:
      return <div>Invalid login type</div>;
  }
}
