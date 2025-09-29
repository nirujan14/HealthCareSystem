import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import PCard from "../../src/components/PCard";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

export default function RecordsScreen() {
  const [records, setRecords] = useState([]);
  const load = async () => { const { data } = await client.get("/records"); setRecords(data); };
  useEffect(() => { load(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <FlatList
        data={records}
        keyExtractor={(r) => r._id}
        renderItem={({ item }) => (
          <PCard style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: "800", color: colors.text }}>{item.hospital} • {item.department}</Text>
            <Text style={{ color: colors.textMuted }}>{new Date(item.visitDate).toLocaleDateString()}</Text>
            <Text style={{ marginTop: 8, color: colors.text }}><Text style={{ fontWeight: "700" }}>Diagnosis: </Text>{item.diagnosis || "-"}</Text>
            <Text style={{ marginTop: 4, color: colors.text }}><Text style={{ fontWeight: "700" }}>Prescription: </Text>{item.prescription || "-"}</Text>
          </PCard>
        )}
        ListEmptyComponent={<Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 40 }}>No records available.</Text>}
      />
    </View>
  );
}
