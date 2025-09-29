import React from "react";
import { View, Text, Image } from "react-native";
import colors from "../constants/colors";

export default function HeaderGreeting({ name = "Guest", avatarUrl }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Good morning</Text>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>{name}</Text>
      </View>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
      ) : (
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight }} />
      )}
    </View>
  );
}
