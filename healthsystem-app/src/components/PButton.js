import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import colors from "../constants/colors";

export default function PButton({ title, onPress, type = "primary", style, textStyle, disabled }) {
  const variants = {
    primary: { bg: colors.primary, color: colors.white },
    black:   { bg: colors.black,   color: colors.white },
    danger:  { bg: colors.danger,  color: colors.white },
    outline: { bg: "transparent",  color: colors.primary, outline: true },
  };
  const v = variants[type] || variants.primary;

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8}>
      <View style={[
        {
          backgroundColor: v.bg,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderWidth: v.outline ? 1.5 : 0,
          borderColor: v.outline ? colors.primary : "transparent",
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}>
        <Text style={[{ color: v.color, fontSize: 16, fontWeight: "700", textAlign: "center" }, textStyle]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
