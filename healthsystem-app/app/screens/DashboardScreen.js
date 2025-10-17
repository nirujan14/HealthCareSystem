import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import HeaderGreeting from "../../src/components/HeaderGreeting";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";
import useSocket from "../../src/hooks/useSocket";

export default function DashboardScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const fadeAnim = new Animated.Value(0);

  const load = async () => {
    try {
      const { data } = await client.get("/appointments");
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  useEffect(() => {
    load();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, []);

  useSocket(user?.id, {
    "appointment:created": load,
    "appointment:updated": load,
  });

  const next = appointments.find((a) => a.status === "BOOKED");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" translucent={false} />

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
          paddingTop: 10,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Greeting */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
            marginBottom: 16,
          }}
        >
          <HeaderGreeting
            name={user?.fullName || "Patient"}
            avatarUrl={user?.avatarUrl}
          />
        </Animated.View>

        {/* Greeting + CTA card with softer gradient */}
        <LinearGradient
          colors={["#EADFFF", "#DCD3FF"]} // 💜 Soft lilac tones (eye-friendly)
          start={[0, 0]}
          end={[1, 1]}
          style={{
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            shadowColor: "#B28EFF",
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Text
            style={{
              color: "#2D0057",
              fontSize: 20,
              fontWeight: "800",
            }}
          >
            Good morning
            {user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
          </Text>
          <Text
            style={{
              color: "#5E4B91",
              marginTop: 6,
              fontSize: 14,
            }}
          >
            Need help? Start an instant consultation.
          </Text>

          <PButton
            title="Instant Consultation"
            type="black"
            onPress={() => {}}
            style={{
              marginTop: 16,
              backgroundColor: "#2D0057",
              borderRadius: 14,
              paddingVertical: 10,
            }}
          />
        </LinearGradient>

        {/* Next appointment */}
        <PCard style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Ionicons
              name="calendar"
              size={20}
              color={colors.primary || "#7A3EF0"}
              style={{ marginRight: 6 }}
            />
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
              Next Appointment
            </Text>
          </View>
          {next ? (
            <>
              <Text style={{ color: colors.text, fontSize: 15 }}>
                {next.hospital?.name || next.hospital} • {next.department?.name || next.department}
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                {new Date(next.date).toLocaleString()}
              </Text>
              <View
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  marginTop: 8,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: colors.white, fontWeight: "600" }}>
                  {next.status}
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ color: colors.textMuted }}>
              No upcoming appointments.
            </Text>
          )}
        </PCard>

        {/* Pulse Card */}
        <PCard style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Ionicons
              name="pulse"
              size={22}
              color={colors.primary || "#7A3EF0"}
              style={{ marginRight: 6 }}
            />
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
              Pulse
            </Text>
          </View>

          <Text style={{ color: "#7A3EF0", fontSize: 40, fontWeight: "800" }}>
            122 <Text style={{ fontSize: 18 }}>BPM</Text>
          </Text>

          <View
            style={{
              height: 48,
              marginTop: 8,
              backgroundColor: "#F3E8FF",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: "75%",
                height: "100%",
                backgroundColor: "#C7B3FF",
                borderRadius: 12,
              }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            <Text style={{ color: colors.textMuted }}>150 Highest</Text>
            <Text style={{ color: colors.textMuted }}>112 Average</Text>
            <Text style={{ color: colors.textMuted }}>98 Lowest</Text>
          </View>
        </PCard>

        {/* Doctors Near Me */}
        <PCard>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Ionicons
              name="person"
              size={20}
              color={colors.primary || "#7A3EF0"}
              style={{ marginRight: 6 }}
            />
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
              Doctors near me
            </Text>
          </View>
          <Text style={{ color: colors.textMuted }}>
            Found 7 doctors within 5 km
          </Text>
        </PCard>
      </ScrollView>
    </SafeAreaView>
  );
}