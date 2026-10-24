
import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [accessToken, setAccessToken] = useState(
        () => localStorage.getItem("accessToken")
    );

    const [refreshToken, setRefreshToken] = useState(
        () => localStorage.getItem("refreshToken")
    );

    const login = async (credentials) => {
        const response = await api.post("/auth/login/", credentials);

        const { access, refresh, user } = response.data;

        localStorage.setItem("accessToken", access);
        localStorage.setItem("refreshToken", refresh);
        localStorage.setItem("user", JSON.stringify(user));

        setAccessToken(access);
        setRefreshToken(refresh);
        setUser(user);

        return user;
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                refreshToken,
                isAuthenticated: Boolean(accessToken && user),
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
