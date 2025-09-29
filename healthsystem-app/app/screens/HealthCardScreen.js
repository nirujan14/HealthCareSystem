import React from "react";
import { View, Text } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../src/context/AuthContext";

export default function HealthCardScreen() {
  const { user } = useAuth();
  const payload = JSON.stringify({ healthCardId: user?.healthCardId, patientId: user?.id });

  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>Show this QR at hospital check-in</Text>
      {!!user?.healthCardId && <QRCode size={220} value={payload} />}
      <Text style={{ marginTop: 8, color:"#666" }}>{user?.healthCardId}</Text>
    </View>
  );
}
