// import { createContext, useContext, useState, useEffect } from "react";
// import axios from "axios";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchUser = async () => {
//     try {
//       const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/me`, {
//         withCredentials: true,
//       });
//       console.log("fetchUser response:", res.data);
//       setUser(res.data.user);
//     } catch (err) {
//       console.error("fetchUser error:", err.response?.data || err.message);
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const login = async (emailOrPhone, password) => {
//     try {
//       const res = await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/users/login`,
//         { emailOrPhone, password },
//         { withCredentials: true }
//       );
//       await fetchUser();
//       return res;
//     } catch (err) {
//       console.error("Login failed:", err.response?.data || err.message);
//       throw err;
//     }
//   };

//   const logout = async () => {
//     try {
//       await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/users/logout`,
//         {},
//         { withCredentials: true }
//       );
//       setUser(null);
//     } catch (err) {
//       console.error("Logout failed:", err.response?.data || err.message);
//     }
//   };

//   const getSessionHistory = async (userId, startDate, endDate) => {
//     try {
//       const res = await axios.get(
//         `${import.meta.env.VITE_BASE_URL}/users/sessions`,
//         {
//           params: { userId, startDate, endDate },
//           withCredentials: true,
//         }
//       );
//       return res.data.data;
//     } catch (err) {
//       console.error("Fetch session history failed:", err.response?.data || err.message);
//       throw err;
//     }
//   };

//   useEffect(() => {
//     fetchUser();
//   }, []);

//   return (
//     <AuthContext.Provider
//       value={{ user, setUser, loading, login, logout, getSessionHistory }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/me`, {
        withCredentials: true,
      });
      console.log("fetchUser response:", res.data);
      setUser(res.data.user); // Expect user object with role.name and balance
    } catch (err) {
      console.error("fetchUser error:", err.response?.data || err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrPhone, password) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/login`,
        { emailOrPhone, password },
        { withCredentials: true }
      );
      await fetchUser(); // Fetch user data after login
      return res;
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
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
      setUser(res.data.user); // Update user state with role.name and balance
      return res;
    } catch (err) {
      console.error("OTP login failed:", err.response?.data || err.message);
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
      console.error("Logout failed:", err.response?.data || err.message);
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
      console.error("Fetch session history failed:", err.response?.data || err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchUser(); // Fetch user on mount to persist session
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, loginWithOtp, logout, getSessionHistory }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);