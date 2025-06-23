// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // useful for initial load

    // Fetch user from cookie on mount
    const fetchUser = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/me`, {
                withCredentials: true,
            });
            setUser(res.data.user);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (emailOrPhone, password) => {
        const res = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/users/login`,
            { emailOrPhone, password },
            { withCredentials: true }
        );
        await fetchUser(); // Refresh user after login
        return res;
    };

    const logout = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_BASE_URL}/users/logout`, {}, {
                withCredentials: true, // send the cookie
            });
            setUser(null); // clear user from context
        } catch (err) {
            console.error("Logout failed", err);
        }
    };
    useEffect(() => {
        fetchUser(); // auto load user on first mount
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
