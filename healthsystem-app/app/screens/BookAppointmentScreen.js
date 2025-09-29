import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

export default function BookAppointmentScreen() {
  const [hospital, setHospital] = useState("NHSL");
  const [department, setDepartment] = useState("General");
  const [date, setDate] = useState("");

  const submit = async () => {
    if (!date) return alert("Enter ISO date/time, e.g. 2025-10-01T09:00:00");
    try { await client.post("/appointments", { hospital, department, date }); alert("Booked"); setDate(""); }
    catch (e) { alert(e?.response?.data?.error || "Booking failed"); }
  };

  const input = { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginTop: 6 };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <PCard style={{ marginBottom: 12 }}>
        <Text style={{ fontWeight: "800", color: colors.text }}>Hospital</Text>
        <TextInput value={hospital} onChangeText={setHospital} style={input} />
      </PCard>

      <PCard style={{ marginBottom: 12 }}>
        <Text style={{ fontWeight: "800", color: colors.text }}>Department</Text>
        <TextInput value={department} onChangeText={setDepartment} style={input} />
      </PCard>

      <PCard>
        <Text style={{ fontWeight: "800", color: colors.text }}>Date & time (ISO)</Text>
        <TextInput placeholder="2025-10-01T09:00:00" value={date} onChangeText={setDate} style={input} />
      </PCard>

      <PButton title="Confirm appointment" onPress={submit} style={{ marginTop: 16, backgroundColor: colors.primary }} />
    </View>
  );
}
