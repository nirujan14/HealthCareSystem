import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  ScrollView, 
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PButton from "../../src/components/PButton";
import PCard from "../../src/components/PCard";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";
import { useAuth } from "../../src/context/AuthContext";
import * as ImagePicker from "expo-image-picker";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({ 
    fullName: "", 
    phone: "", 
    address: "", 
    bloodGroup: "", 
    allergies: [],
    emergencyContact: "",
    dateOfBirth: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data } = await client.get("/patients/me");
      setForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
        address: data.address || "",
        bloodGroup: data.bloodGroup || "",
        allergies: data.allergies || [],
        emergencyContact: data.emergencyContact || "",
        dateOfBirth: data.dateOfBirth || "",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!form.fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }

    setSaving(true);
    try {
      const { data } = await client.patch("/patients/me", form);
      setUser(data);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow access to your photos to upload an avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
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
      Alert.alert("Success", "Profile picture updated");
    } catch (error) {
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout }
      ]
    );
  };

  const inputStyle = { 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 12, 
    padding: 16, 
    marginTop: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMuted }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 6 : 0
      }}
    >
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={{ padding: 16 }}>
          <PCard style={{ alignItems: "center", padding: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ position: 'relative' }}>
                {user?.avatarUrl ? (
                  <Image 
                    source={{ uri: user.avatarUrl }} 
                    style={{ width: 100, height: 100, borderRadius: 50 }} 
                  />
                ) : (
                  <View style={{ 
                    width: 100, 
                    height: 100, 
                    borderRadius: 50, 
                    backgroundColor: "#EADFFF",
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Ionicons name="person" size={40} color="#2D0057" />
                  </View>
                )}
                
                <TouchableOpacity 
                  onPress={uploadAvatar}
                  disabled={uploading}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: colors.primary,
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 3,
                    borderColor: colors.white
                  }}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Ionicons name="camera" size={18} color={colors.white} />
                  )}
                </TouchableOpacity>
              </View>
              
              <Text style={{ 
                fontSize: 20, 
                fontWeight: "800", 
                color: colors.text,
                marginTop: 16,
                marginBottom: 4
              }}>
                {form.fullName || "Your Name"}
              </Text>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>
                {user?.email || "No email provided"}
              </Text>
            </View>

            <PButton 
              title="Change Profile Picture" 
              onPress={uploadAvatar} 
              type="outline" 
              loading={uploading}
              style={{ width: '100%' }}
            />
          </PCard>
        </View>

        {/* Personal Information */}
        <View style={{ padding: 16 }}>
          <PCard style={{ padding: 20 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: "800", 
              color: colors.text,
              marginBottom: 20 
            }}>
              Personal Information
            </Text>

            {/* Full Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Full Name *</Text>
              <TextInput 
                value={form.fullName} 
                onChangeText={(t) => setForm((s) => ({ ...s, fullName: t }))} 
                style={inputStyle}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Phone */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Phone</Text>
              <TextInput 
                value={form.phone} 
                onChangeText={(t) => setForm((s) => ({ ...s, phone: t }))} 
                style={inputStyle}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            {/* Date of Birth */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Date of Birth</Text>
              <TextInput 
                value={form.dateOfBirth} 
                onChangeText={(t) => setForm((s) => ({ ...s, dateOfBirth: t }))} 
                style={inputStyle}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Address */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Address</Text>
              <TextInput 
                value={form.address} 
                onChangeText={(t) => setForm((s) => ({ ...s, address: t }))} 
                style={[inputStyle, { textAlignVertical: 'top', minHeight: 80 }]}
                placeholder="Enter your address"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Blood Group */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Blood Group</Text>
              <TouchableOpacity
                style={[inputStyle, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                onPress={() => setShowBloodGroupPicker(!showBloodGroupPicker)}
              >
                <Text style={{ color: form.bloodGroup ? colors.text : colors.textMuted }}>
                  {form.bloodGroup || "Select blood group"}
                </Text>
                <Ionicons 
                  name={showBloodGroupPicker ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.textMuted} 
                />
              </TouchableOpacity>

              {showBloodGroupPicker && (
                <View style={{ 
                  backgroundColor: colors.white, 
                  borderWidth: 1, 
                  borderColor: colors.border, 
                  borderRadius: 12,
                  marginTop: 8,
                  maxHeight: 200
                }}>
                  <ScrollView>
                    {BLOOD_GROUPS.map((group) => (
                      <TouchableOpacity
                        key={group}
                        style={{
                          padding: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                          backgroundColor: form.bloodGroup === group ? `${colors.primary}10` : 'transparent'
                        }}
                        onPress={() => {
                          setForm((s) => ({ ...s, bloodGroup: group }));
                          setShowBloodGroupPicker(false);
                        }}
                      >
                        <Text style={{ 
                          color: form.bloodGroup === group ? colors.primary : colors.text,
                          fontWeight: form.bloodGroup === group ? '600' : '400'
                        }}>
                          {group}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Emergency Contact */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>Emergency Contact</Text>
              <TextInput 
                value={form.emergencyContact} 
                onChangeText={(t) => setForm((s) => ({ ...s, emergencyContact: t }))} 
                style={inputStyle}
                placeholder="Emergency contact number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            {/* Save Button */}
            <PButton 
              title="Save Changes" 
              onPress={save} 
              loading={saving}
              style={{ marginBottom: 12 }}
            />

            {/* Logout Button */}
            <PButton 
              title="Logout" 
              onPress={handleLogout} 
              type="outline"
              textStyle={{ color: colors.danger }}
              style={{ borderColor: colors.danger }}
            />
          </PCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
