import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import client from "../../src/api/client";
import useSocket from "../../src/hooks/useSocket";

export default function DashboardScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);

  const load = async () => {
    const { data } = await client.get("/appointments");
    setAppointments(data.slice(0, 5));
  };

  useEffect(() => { load(); }, []);
  useSocket(user?.id, {
    "appointment:created": load,
    "appointment:updated": load
  });

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 12 }}>
        Hi {user?.fullName?.split(" ")[0]}, your upcoming appointments
      </Text>
      <FlatList
        data={appointments}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8 }}>
            <Text>{item.hospital} • {item.department}</Text>
            <Text>{new Date(item.date).toLocaleString()}</Text>
            <Text>Status: {item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No appointments yet.</Text>}
      />
    </View>
  );
}
