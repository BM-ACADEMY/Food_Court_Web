


import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

// ✅ Global socket instance
const socket = io(import.meta.env.VITE_BASE_SOCKET_URL, {
  withCredentials: true,
});

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/me`, {
        withCredentials: true,
      });

      const fetchedUser = res.data.user;


      // 🔁 Always set a new object to trigger re-render
      setUser({ ...fetchedUser });

    } catch (err) {
      console.error("❌ fetchUser error:", err.response?.data || err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchUser(); // Run on mount
  }, []);

 

  const login = async (emailOrPhone, password, role) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/login`,
        { emailOrPhone, password, role },
        { withCredentials: true }
      );
      await fetchUser(); // Load user after login
      return res;
    } catch (err) {
      console.error("❌ Login failed:", err.response?.data || err.message);
      throw err;
    }
  };

  const loginWithOtp = async (phone_number, otp) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/verify-otp-login-otp`,
        { phone_number, otp },
        { withCredentials: true }
      );
      setUser(res.data.user);
      return res;
    } catch (err) {
      console.error("❌ OTP login failed:", err.response?.data || err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/logout`,
        {},
        { withCredentials: true }
      );
      setUser(null);
    } catch (err) {
      console.error("❌ Logout failed:", err.response?.data || err.message);
    }
  };

  const getSessionHistory = async (userId, startDate, endDate) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/users/sessions`,
        {
          params: { userId, startDate, endDate },
          withCredentials: true,
        }
      );
      return res.data.data;
    } catch (err) {
      console.error("❌ Fetch session history failed:", err.response?.data || err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, loginWithOtp, logout, getSessionHistory,fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
