import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../src/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("patient1@example.com");
  const [password, setPassword] = useState("pass1234");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      await login(email, password);
    } catch (e) {
      Alert.alert("Login failed", e?.response?.data?.error || "Try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 24, flex: 1, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "600", marginBottom: 16 }}>Patient Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 }}
      />
      <TouchableOpacity
        onPress={onSubmit}
        disabled={loading}
        style={{ backgroundColor: "#0ea5e9", padding: 14, borderRadius: 8 }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
          {loading ? "Signing in..." : "Sign in"}
        </Text>
      </TouchableOpacity>
      <Text style={{ marginTop: 12, color: "#666" }}>
        No self-registration. Contact hospital to get access.
      </Text>
    </View>
  );
}
