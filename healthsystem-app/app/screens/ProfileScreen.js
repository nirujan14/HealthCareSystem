import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Image } from "react-native";
import PButton from "../../src/components/PButton";
import PCard from "../../src/components/PCard";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";
import { useAuth } from "../../src/context/AuthContext";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", bloodGroup: "", allergies: [] });

  useEffect(() => {
    (async () => {
      const { data } = await client.get("/patients/me");
      setForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
        address: data.address || "",
        bloodGroup: data.bloodGroup || "",
        allergies: data.allergies || [],
      });
    })();
  }, []);

  const save = async () => { const { data } = await client.patch("/patients/me", form); setUser(data); alert("Saved"); };

  const uploadAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (res.canceled) return;
    const asset = res.assets[0];
    const body = new FormData();
    body.append("file", { uri: asset.uri, name: "avatar.jpg", type: "image/jpeg" });
    const { data } = await client.post("/patients/me/avatar", body, { headers: { "Content-Type": "multipart/form-data" } });
    setUser(data);
  };

  const input = { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginTop: 6 };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <PCard style={{ alignItems: "center", marginBottom: 12 }}>
        {user?.avatarUrl
          ? <Image source={{ uri: user.avatarUrl }} style={{ width: 90, height: 90, borderRadius: 45, marginBottom: 8 }} />
          : <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primaryLight, marginBottom: 8 }} />}
        <PButton title="Upload avatar" onPress={uploadAvatar} type="outline" />
      </PCard>

      <PCard>
        <Text style={{ fontWeight: "800", color: colors.text }}>Full name</Text>
        <TextInput value={form.fullName} onChangeText={(t) => setForm((s) => ({ ...s, fullName: t }))} style={input} />

        <Text style={{ marginTop: 12, fontWeight: "800", color: colors.text }}>Phone</Text>
        <TextInput value={form.phone} onChangeText={(t) => setForm((s) => ({ ...s, phone: t }))} style={input} keyboardType="phone-pad" />

        <Text style={{ marginTop: 12, fontWeight: "800", color: colors.text }}>Address</Text>
        <TextInput value={form.address} onChangeText={(t) => setForm((s) => ({ ...s, address: t }))} style={input} />

        <Text style={{ marginTop: 12, fontWeight: "800", color: colors.text }}>Blood group</Text>
        <TextInput value={form.bloodGroup} onChangeText={(t) => setForm((s) => ({ ...s, bloodGroup: t }))} style={input} />

        <PButton title="Save changes" onPress={save} style={{ marginTop: 16, backgroundColor: colors.primary }} />
        <PButton title="Logout" onPress={logout} type="danger" style={{ marginTop: 10 }} />
      </PCard>
    </View>
  );
}
