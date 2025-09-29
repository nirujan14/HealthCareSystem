import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwtDecode from "jwt-decode";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          jwtDecode(token);
          const { data } = await client.get("/patients/me");
          setUser(data);
        } catch {
          await AsyncStorage.removeItem("token");
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await client.post("/auth/login", { email, password });
    await AsyncStorage.setItem("token", data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
