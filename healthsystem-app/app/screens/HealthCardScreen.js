import React from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Share,
  SafeAreaView,
  Platform,
  StatusBar
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import colors from "../../src/constants/colors";

export default function HealthCardScreen() {
  const { user } = useAuth();
  
  const healthCardData = {
    healthCardId: user?.healthCardId,
    patientId: user?.id,
    name: user?.name,
    dateOfBirth: user?.dateOfBirth,
    bloodGroup: user?.bloodGroup,
    emergencyContact: user?.emergencyContact
  };

  const payload = JSON.stringify(healthCardData);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My Health Card ID: ${user?.healthCardId}\nName: ${user?.name}\nUse this QR code for quick hospital check-in.`,
        title: 'My Health Card'
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share health card");
    }
  };

  const handleEmergencyInfo = () => {
    Alert.alert(
      "Emergency Information",
      `Name: ${user?.name}\nBlood Group: ${user?.bloodGroup || 'Not specified'}\nEmergency Contact: ${user?.emergencyContact || 'Not set'}`,
      [{ text: "OK" }]
    );
  };

  const formatHealthCardId = (id) => {
    if (!id) return 'Not Available';
    return id.match(/.{1,4}/g)?.join(' ') || id;
  };

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 6 : 0 
      }}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Health Card */}
        <LinearGradient 
          colors={["#EADFFF", "#DCD3FF"]}
          start={[0, 0]} 
          end={[1, 1]} 
          style={{
            margin: 16,
            borderRadius: 20,
            padding: 20,
            alignItems: "center",
            shadowColor: "#B28EFF",
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            width: '100%', 
            marginBottom: 20 
          }}>
            <View>
              <Text style={{ color: "#5E4B91", fontSize: 14, fontWeight: "600" }}>Health Card</Text>
              <Text style={{ color: "#2D0057", fontSize: 16, fontWeight: "800", marginTop: 4 }}>
                {user?.name || 'Patient Name'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleShare} style={{
              padding: 8,
              backgroundColor: 'rgba(45, 0, 87, 0.1)',
              borderRadius: 12
            }}>
              <Ionicons name="share-outline" size={20} color="#2D0057" />
            </TouchableOpacity>
          </View>

          {/* QR Code */}
          <View style={{ 
            backgroundColor: colors.white, 
            padding: 20, 
            borderRadius: 16,
            marginBottom: 20
          }}>
            {user?.healthCardId ? (
              <QRCode 
                size={200} 
                value={payload}
                logoBackgroundColor="transparent"
              />
            ) : (
              <View style={{ width: 200, height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="warning-outline" size={40} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: 12, textAlign: 'center' }}>
                  No Health Card ID Available
                </Text>
              </View>
            )}
          </View>

          {/* Health Card ID */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: "#5E4B91", fontSize: 12, fontWeight: "500", marginBottom: 8 }}>
              HEALTH CARD ID
            </Text>
            <Text style={{ color: "#2D0057", fontSize: 18, fontWeight: "700" }}>
              {formatHealthCardId(user?.healthCardId)}
            </Text>
          </View>

          {/* Info */}
          <Text style={{ 
            color: "#5E4B91", 
            fontSize: 14, 
            textAlign: 'center',
            lineHeight: 20
          }}>
            Show this QR code at hospital check-in for quick registration
          </Text>
        </LinearGradient>

        {/* Additional Information */}
        <View style={{ padding: 16 }}>
          {/* Emergency Information */}
          <TouchableOpacity 
            onPress={handleEmergencyInfo} 
            style={{
              backgroundColor: colors.white,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="medical" size={20} color="#7A3EF0" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginLeft: 8 }}>
                Emergency Information
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <View style={{ marginBottom: 12, minWidth: '45%' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Blood Group</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  {user?.bloodGroup || 'Not specified'}
                </Text>
              </View>
              
              <View style={{ marginBottom: 12, minWidth: '45%' }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Emergency Contact</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                  {user?.emergencyContact || 'Not set'}
                </Text>
              </View>
            </View>
            
            <Text style={{ fontSize: 12, color: colors.primary, textAlign: 'center', marginTop: 8 }}>
              Tap to view full emergency information
            </Text>
          </TouchableOpacity>

          {/* How to Use */}
          <View style={{
            backgroundColor: `${colors.primary}08`,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: `${colors.primary}20`
          }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
              How to Use Your Health Card
            </Text>
            
            {[
              "Present QR code at hospital registration",
              "Share with healthcare providers when requested",
              "Keep accessible for emergency situations",
              "Update personal information regularly"
            ].map((instruction, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginTop: 2, marginRight: 8 }} />
                <Text style={{ fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 }}>
                  {instruction}
                </Text>
              </View>
            ))}
          </View>

          {/* Last Updated */}
          <Text style={{ 
            fontSize: 12, 
            color: colors.textMuted, 
            textAlign: 'center', 
            marginTop: 20
          }}>
            Health Card • Last updated {new Date().toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
