import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import client from "../../src/api/client";

export default function RecordsScreen() {
  const [records, setRecords] = useState([]);

  const load = async () => {
    const { data } = await client.get("/records");
    setRecords(data);
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={{ padding: 16 }}>
      <FlatList
        data={records}
        keyExtractor={r => r._id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8 }}>
            <Text style={{ fontWeight: "600" }}>{item.hospital} • {item.department}</Text>
            <Text>{new Date(item.visitDate).toLocaleDateString()}</Text>
            <Text>Dx: {item.diagnosis || "-"}</Text>
            <Text>Rx: {item.prescription || "-"}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No records available.</Text>}
      />
    </View>
  );
}
