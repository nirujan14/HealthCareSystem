import React from "react";
import { View, Text } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../src/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import colors from "../../src/constants/colors";
import { gradientBg } from "../../src/constants/theme";

export default function HealthCardScreen() {
  const { user } = useAuth();
  const payload = JSON.stringify({ healthCardId: user?.healthCardId, patientId: user?.id });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, justifyContent: "center" }}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={[0,0]} end={[1,1]} style={[gradientBg, { alignItems: "center" }]}>
        <Text style={{ color: colors.white, fontSize: 18, fontWeight: "800", marginBottom: 12 }}>Your Health Card</Text>
        <View style={{ backgroundColor: colors.white, padding: 16, borderRadius: 16 }}>
          {!!user?.healthCardId && <QRCode size={200} value={payload} />}
        </View>
        <Text style={{ color: "#EDE9FE", marginTop: 12 }}>Show this at hospital check-in</Text>
        <Text style={{ color: colors.white, marginTop: 4, fontWeight: "700" }}>{user?.healthCardId}</Text>
      </LinearGradient>
    </View>
  );
}
