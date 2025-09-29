import React from "react";
import { View } from "react-native";
import { cardStyle } from "../constants/theme";

export default function PCard({ style, children }) {
  return <View style={[cardStyle, style]}>{children}</View>;
}
