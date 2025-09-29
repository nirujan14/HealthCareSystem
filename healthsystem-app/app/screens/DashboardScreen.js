import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import HeaderGreeting from "../../src/components/HeaderGreeting";
import colors from "../../src/constants/colors";
import { gradientBg } from "../../src/constants/theme";
import client from "../../src/api/client";
import useSocket from "../../src/hooks/useSocket";
import { LinearGradient } from "expo-linear-gradient";

export default function DashboardScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);

  const load = async () => {
    const { data } = await client.get("/appointments");
    setAppointments(data);
  };

  useEffect(() => { load(); }, []);
  useSocket(user?.id, { "appointment:created": load, "appointment:updated": load });

  const next = appointments.find(a => a.status === "BOOKED");

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      <HeaderGreeting name={user?.fullName || "Patient"} avatarUrl={user?.avatarUrl} />

      {/* Greeting + CTA card */}
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={[0,0]} end={[1,1]} style={[gradientBg, { marginBottom: 16 }]}>
        <Text style={{ color: colors.white, fontSize: 18, fontWeight: "800" }}>Good morning{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}</Text>
        <Text style={{ color: "#EDE9FE", marginTop: 6 }}>Need help? Start an instant consultation.</Text>
        <PButton title="Instant Consultation" type="black" onPress={() => {}} style={{ marginTop: 14, backgroundColor: colors.black }} />
      </LinearGradient>

      {/* Next appointment */}
      <PCard style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 8 }}>Next Appointment</Text>
        {next ? (
          <>
            <Text style={{ color: colors.text }}>
              {next.hospital} • {next.department}
            </Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>{new Date(next.date).toLocaleString()}</Text>
            <Text style={{ marginTop: 8, ...{ color: colors.white, backgroundColor: colors.primary, alignSelf:"flex-start", paddingHorizontal:10, paddingVertical:6, borderRadius:999 } }}>
              {next.status}
            </Text>
          </>
        ) : (
          <Text style={{ color: colors.textMuted }}>No upcoming appointments.</Text>
        )}
      </PCard>

      {/* Health stats mock block (visual like Dribbble) */}
      <PCard style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 8 }}>Pulse</Text>
        <Text style={{ color: colors.primary, fontSize: 36, fontWeight: "800" }}>122 <Text style={{ fontSize: 16 }}>BPM</Text></Text>
        <View style={{ height: 48, marginTop: 8, backgroundColor: "#FFF6F2", borderRadius: 12 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
          <Text style={{ color: colors.textMuted }}>150 Highest</Text>
          <Text style={{ color: colors.textMuted }}>112 Average</Text>
          <Text style={{ color: colors.textMuted }}>98 Lowest</Text>
        </View>
      </PCard>

      {/* Doctors near me (simple placeholder) */}
      <PCard>
        <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 10 }}>Doctors near me</Text>
        <Text style={{ color: colors.textMuted }}>Found 7 doctors within 5 km</Text>
      </PCard>
    </ScrollView>
  );
}
