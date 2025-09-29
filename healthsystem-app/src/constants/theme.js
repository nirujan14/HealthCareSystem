import colors from "./colors";

export const shadow = {
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};

export const cardStyle = {
  backgroundColor: colors.card,
  borderRadius: 18,
  padding: 16,
  ...shadow,
};

export const gradientBg = {
  borderRadius: 22,
  padding: 18,
};

export const badge = (bg, color = colors.white) => ({
  alignSelf: "flex-start",
  backgroundColor: bg,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 999,
  color,
  fontSize: 12,
  fontWeight: "600",
});
