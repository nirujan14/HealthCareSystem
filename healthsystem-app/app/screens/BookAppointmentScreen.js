import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import client from "../../src/api/client";

export default function BookAppointmentScreen() {
  const [hospital, setHospital] = useState("NHSL");
  const [department, setDepartment] = useState("General");
  const [date, setDate] = useState("");

  const submit = async () => {
    try {
      if (!date) return Alert.alert("Pick a date/time ISO format e.g. 2025-10-01T09:00:00");
      await client.post("/appointments", { hospital, department, date });
      Alert.alert("Success", "Appointment booked");
      setDate("");
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || "Failed to book");
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: "600" }}>Hospital</Text>
      <TextInput value={hospital} onChangeText={setHospital} style={{ borderWidth:1, padding:10, borderRadius:8, marginBottom:12 }}/>
      <Text style={{ fontWeight: "600" }}>Department</Text>
      <TextInput value={department} onChangeText={setDepartment} style={{ borderWidth:1, padding:10, borderRadius:8, marginBottom:12 }}/>
      <Text style={{ fontWeight: "600" }}>Date & time (ISO)</Text>
      <TextInput placeholder="2025-10-01T09:00:00" value={date} onChangeText={setDate} style={{ borderWidth:1, padding:10, borderRadius:8, marginBottom:16 }}/>
      <TouchableOpacity onPress={submit} style={{ backgroundColor:"#22c55e", padding:14, borderRadius:8 }}>
        <Text style={{ color:"#fff", textAlign:"center", fontWeight:"600" }}>Book</Text>
      </TouchableOpacity>
    </View>
  );
}
