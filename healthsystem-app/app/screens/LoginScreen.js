import React, { useState } from "react";
import { View, Text, TextInput, KeyboardAvoidingView, Platform, Image } from "react-native";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("patient1@example.com");
  const [password, setPassword] = useState("pass1234");
  const [loading, setLoading] = useState(false);
  const { login } = require("../../src/context/AuthContext").useAuth();

  const onSubmit = async () => {
    try { setLoading(true); await login(email, password); }
    catch (e) { alert(e?.response?.data?.error || "Login failed"); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: 22, justifyContent: "center" }}>
        {/* Illustration area (use any image if you want) */}
        <View style={{ alignItems: "center", marginBottom: 18 }}>
          <Image source={{ uri: "https://i.imgur.com/6l2Qh0E.png" }} style={{ width: 120, height: 120, borderRadius: 24, opacity: 0.9 }} />
        </View>

        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: 6 }}>Patient Login</Text>
        <Text style={{ color: colors.textMuted, marginBottom: 18 }}>Welcome back. Sign in to continue.</Text>

        <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Email</Text>
          <TextInput
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 }}
          />
        </View>

        <View style={{ backgroundColor: colors.card, borderRadius: 18, padding: 16 }}>
          <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Password</Text>
          <TextInput
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12 }}
          />
        </View>

        <PButton title={loading ? "Signing in..." : "Sign in"} onPress={onSubmit} disabled={loading} style={{ marginTop: 18, backgroundColor: colors.primary }} />
        <Text style={{ textAlign: "center", marginTop: 10, color: colors.textMuted }}>No self-registration. Contact hospital to get access.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}
