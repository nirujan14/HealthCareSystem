// healthsystem-app/src/context/AuthContext.js
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
          const decoded = jwtDecode(token);
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            await AsyncStorage.removeItem("token");
            setLoading(false);
            return;
          }
          
          // Set user from token first for immediate access
          setUser({
            id: decoded.id,
            userType: decoded.userType,
            email: decoded.email,
            fullName: decoded.fullName
          });
          
          // Then fetch fresh user data
          try {
            const endpoint = decoded.userType === "PATIENT" 
              ? "/patients/me" 
              : "/staff/me";
            const { data } = await client.get(endpoint);
            setUser(data);
          } catch (fetchError) {
            console.error("Failed to fetch user data:", fetchError);
            // Keep the basic user info from token
          }
        } catch (error) {
          console.error("Token validation error:", error);
          await AsyncStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email, password, userType = "PATIENT") => {
    try {
      const { data } = await client.post("/auth/login", { 
        email, 
        password, 
        userType 
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      await AsyncStorage.setItem("token", data.token);
      setUser(data.user || data); // Handle both response formats
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Login failed";
      console.error("Login error:", errorMessage, error.response?.data);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await client.post("/auth/logout").catch(() => {}); // Ignore errors
    } finally {
      await AsyncStorage.removeItem("token");
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      login, 
      logout, 
      loading,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};