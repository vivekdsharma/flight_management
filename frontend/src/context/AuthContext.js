import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem("token");
    const firstName = localStorage.getItem("firstName");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");
    const passengerId = localStorage.getItem("passengerId");

    if (savedToken) {
      return {
        token: savedToken,
        firstName: firstName || "User",
        email: email || "",
        role: role || (email === "vsharma6_be23@thapar.edu" ? "admin" : "user"),
        passengerId: passengerId || null,
      };
    }
    return null;
  });

  const login = (tokenData, userData) => {
    localStorage.setItem("token", tokenData);
    localStorage.setItem("firstName", userData.first_name || "");
    localStorage.setItem("email", userData.email || "");
    localStorage.setItem("role", userData.role || (userData.email === "vsharma6_be23@thapar.edu" ? "admin" : "user"));
    if (userData.passengerId) {
      localStorage.setItem("passengerId", userData.passengerId);
    }

    setToken(tokenData);
    setUser({
      token: tokenData,
      firstName: userData.first_name,
      lastName: userData.last_name,
      email: userData.email,
      role: userData.role || (userData.email === "vsharma6_be23@thapar.edu" ? "admin" : "user"),
      passengerId: userData.passengerId,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("passengerId");
    setToken(null);
    setUser(null);
  };

  const isAdmin =
    user?.role === "admin" ||
    user?.email === "vsharma6_be23@thapar.edu";

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
