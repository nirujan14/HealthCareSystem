import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import client from "../../src/api/client";
import { useAuth } from "../../src/context/AuthContext";

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ fullName:"", phone:"", address:"", bloodGroup:"", allergies:[] });

  useEffect(() => {
    (async () => {
      const { data } = await client.get("/patients/me");
      setForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
        address: data.address || "",
        bloodGroup: data.bloodGroup || "",
        allergies: data.allergies || []
      });
    })();
  }, []);

  const save = async () => {
    const { data } = await client.patch("/patients/me", form);
    setUser(data);
    Alert.alert("Saved");
  };

  const uploadAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });
    if (res.canceled) return;
    const asset = res.assets[0];
    const body = new FormData();
    body.append("file", {
      uri: asset.uri,
      name: "avatar.jpg",
      type: "image/jpeg"
    });
    const { data } = await client.post("/patients/me/avatar", body, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    setUser(data);
  };

  return (
    <View style={{ padding: 16 }}>
      {!!user?.avatarUrl && <Image source={{ uri: user.avatarUrl }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }}/>}
      <TouchableOpacity onPress={uploadAvatar} style={{ padding: 10, backgroundColor:"#0ea5e9", borderRadius: 8, marginBottom: 16 }}>
        <Text style={{ color:"#fff", textAlign:"center" }}>Upload Avatar</Text>
      </TouchableOpacity>

      <Text>Full name</Text>
      <TextInput value={form.fullName} onChangeText={t=>setForm(s=>({...s, fullName:t}))} style={{ borderWidth:1, borderRadius:8, padding:10, marginBottom:8 }}/>
      <Text>Phone</Text>
      <TextInput value={form.phone} onChangeText={t=>setForm(s=>({...s, phone:t}))} style={{ borderWidth:1, borderRadius:8, padding:10, marginBottom:8 }}/>
      <Text>Address</Text>
      <TextInput value={form.address} onChangeText={t=>setForm(s=>({...s, address:t}))} style={{ borderWidth:1, borderRadius:8, padding:10, marginBottom:8 }}/>
      <Text>Blood Group</Text>
      <TextInput value={form.bloodGroup} onChangeText={t=>setForm(s=>({...s, bloodGroup:t}))} style={{ borderWidth:1, borderRadius:8, padding:10, marginBottom:12 }}/>

      <TouchableOpacity onPress={save} style={{ backgroundColor:"#22c55e", padding:14, borderRadius:8, marginBottom:12 }}>
        <Text style={{ color:"#fff", textAlign:"center", fontWeight:"600" }}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={logout} style={{ backgroundColor:"#ef4444", padding:14, borderRadius:8 }}>
        <Text style={{ color:"#fff", textAlign:"center", fontWeight:"600" }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
