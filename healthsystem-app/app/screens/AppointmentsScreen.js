import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import client from "../../src/api/client";

export default function AppointmentsScreen() {
  const [items, setItems] = useState([]);

  const load = async () => {
    const { data } = await client.get("/appointments");
    setItems(data);
  };

  const cancel = async (id) => {
    try {
      await client.patch(`/appointments/${id}/cancel`);
      await load();
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.error || "Failed to cancel");
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={{ padding: 16 }}>
      <FlatList
        data={items}
        keyExtractor={i => i._id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8 }}>
            <Text style={{ fontWeight: "600" }}>{item.hospital} • {item.department}</Text>
            <Text>{new Date(item.date).toLocaleString()}</Text>
            <Text>Status: {item.status}</Text>
            {item.status === "BOOKED" && (
              <TouchableOpacity onPress={() => cancel(item._id)} style={{ marginTop: 8, padding: 10, backgroundColor: "#ef4444", borderRadius: 6 }}>
                <Text style={{ color: "#fff", textAlign: "center" }}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text>No appointments.</Text>}
      />
    </View>
  );
}
