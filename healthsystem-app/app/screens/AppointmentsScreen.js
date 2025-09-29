import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

export default function AppointmentsScreen() {
  const [items, setItems] = useState([]);
  const load = async () => { const { data } = await client.get("/appointments"); setItems(data); };
  useEffect(() => { load(); }, []);

  const colorByStatus = (s) =>
    s === "BOOKED" ? colors.primary :
    s === "COMPLETED" ? colors.success : colors.textMuted;

  const cancel = async (id) => { try { await client.patch(`/appointments/${id}/cancel`); load(); } catch (e) { alert("Cancel failed"); } };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => (
          <PCard style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: "800", color: colors.text }}>{item.hospital} • {item.department}</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>{new Date(item.date).toLocaleString()}</Text>
            <Text style={{ marginTop: 8, alignSelf: "flex-start", backgroundColor: colorByStatus(item.status), color: colors.white, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
              {item.status}
            </Text>
            {item.status === "BOOKED" && (
              <PButton title="Cancel appointment" type="danger" onPress={() => cancel(item._id)} style={{ marginTop: 12 }} />
            )}
          </PCard>
        )}
        ListEmptyComponent={<Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 40 }}>No appointments.</Text>}
      />
    </View>
  );
}
