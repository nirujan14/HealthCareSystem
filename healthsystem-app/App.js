import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AuthNavigator from "./app/AuthNavigator";
import AppNavigator from "./app/AppNavigator";
import { ActivityIndicator, View } from "react-native";

function Root() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  return user ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  console.log("🌍 API Base:", process.env.EXPO_PUBLIC_API_URL);
  console.log("⚙️ App Env:", process.env.EXPO_PUBLIC_APP_ENV);

  return (
    <AuthProvider>
      <NavigationContainer>
        <Root />
      </NavigationContainer>
    </AuthProvider>
  );
}
