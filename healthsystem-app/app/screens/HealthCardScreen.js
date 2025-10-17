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
  
  // Comprehensive health card data matching your MongoDB structure
  const healthCardData = {
    // Basic Identity
    _id: user?.id,
    healthCardId: user?.healthCardId,
    email: user?.email,
    fullName: user?.fullName,
    
    // Contact Information
    phone: user?.phone,
    alternatePhone: user?.alternatePhone,
    
    // Personal Details
    nic: user?.nic,
    dateOfBirth: user?.dateOfBirth,
    age: user?.age,
    gender: user?.gender,
    
    // Address (matching DB structure)
    address: user?.address || null,
    
    // Medical Information
    bloodGroup: user?.bloodGroup,
    
    // Allergies array (matching DB structure: Array of objects with allergen, reaction, severity)
    allergies: user?.allergies || [],
    
    // Chronic Conditions array (matching DB structure)
    chronicConditions: user?.chronicConditions || [],
    
    // Current Medications array (matching DB structure)
    currentMedications: user?.currentMedications || [],
    
    // Emergency Contact (matching DB structure)
    emergencyContact: user?.emergencyContact || null,
    
    // Insurance Information array (matching DB structure)
    insuranceInfo: user?.insuranceInfo || [],
    
    // Additional Profile Info
    preferredLanguage: user?.preferredLanguage,
    nationality: user?.nationality,
    occupation: user?.occupation,
    maritalStatus: user?.maritalStatus,
    ethnicity: user?.ethnicity,
    religion: user?.religion,
    
    // Medical History
    lastVisit: user?.lastVisit || null,
    preferredHospital: user?.preferredHospital,
    
    // Account Information
    isActive: user?.isActive,
    accountStatus: user?.accountStatus,
    registrationDate: user?.registrationDate,
    
    // Avatar
    avatarUrl: user?.avatarUrl,
    
    // Metadata for QR code
    qrGeneratedAt: new Date().toISOString(),
    qrVersion: "2.0"
  };

  const payload = JSON.stringify(healthCardData);

  const handleShare = async () => {
    try {
      let allergyText = 'None';
      if (user?.allergies && user.allergies.length > 0) {
        allergyText = user.allergies.map(a => {
          if (typeof a === 'string') return a;
          return `${a.allergen} (${a.severity || 'unknown severity'})`;
        }).join(', ');
      }

      const shareMessage = `
🏥 My Health Card
━━━━━━━━━━━━━━━━━━━━
Name: ${user?.fullName || 'Not provided'}
Health Card ID: ${user?.healthCardId || 'Not available'}
Blood Group: ${user?.bloodGroup || 'Not specified'}
Phone: ${user?.phone || 'Not provided'}

⚠️ Allergies: ${allergyText}

🚨 Emergency Contact: ${user?.emergencyContact?.name || 'Not set'}
   Phone: ${user?.emergencyContact?.phone || 'Not set'}
━━━━━━━━━━━━━━━━━━━━
Present this QR code at any hospital for quick check-in.
      `.trim();

      await Share.share({
        message: shareMessage,
        title: 'My Health Card'
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share health card");
    }
  };

  const handleEmergencyInfo = () => {
    // Format allergies
    let allergiesText = 'None recorded';
    if (user?.allergies && user.allergies.length > 0) {
      allergiesText = user.allergies.map(a => {
        if (typeof a === 'string') return `• ${a}`;
        return `• ${a.allergen} - ${a.reaction || 'No reaction noted'} (${a.severity || 'Severity not specified'})`;
      }).join('\n   ');
    }

    // Format chronic conditions
    let conditionsText = 'None recorded';
    if (user?.chronicConditions && user.chronicConditions.length > 0) {
      conditionsText = user.chronicConditions.map(c => {
        if (typeof c === 'string') return `• ${c}`;
        return `• ${c.condition} (${c.status || 'Status unknown'})`;
      }).join('\n   ');
    }

    // Format medications
    let medicationsText = 'None';
    if (user?.currentMedications && user.currentMedications.length > 0) {
      medicationsText = user.currentMedications.map(m => {
        if (typeof m === 'string') return `• ${m}`;
        return `• ${m.name} - ${m.dosage || 'Dosage not specified'} (${m.frequency || ''})`;
      }).join('\n   ');
    }

    const emergencyInfo = `
━━━━━━━━━━━━━━━━━━━━
EMERGENCY INFORMATION
━━━━━━━━━━━━━━━━━━━━

👤 Name: ${user?.fullName || 'Not provided'}
🆔 Health Card: ${user?.healthCardId || 'N/A'}
📧 Email: ${user?.email || 'N/A'}

🩸 Blood Group: ${user?.bloodGroup || 'Not specified'}
📞 Phone: ${user?.phone || 'Not provided'}
${user?.alternatePhone ? `📱 Alternate: ${user.alternatePhone}` : ''}

🚨 Emergency Contact:
   Name: ${user?.emergencyContact?.name || 'Not set'}
   Relation: ${user?.emergencyContact?.relationship || 'N/A'}
   Phone: ${user?.emergencyContact?.phone || 'Not provided'}
   ${user?.emergencyContact?.alternatePhone ? `Alternate: ${user.emergencyContact.alternatePhone}` : ''}

⚠️ ALLERGIES:
   ${allergiesText}

🏥 CHRONIC CONDITIONS:
   ${conditionsText}

💊 CURRENT MEDICATIONS:
   ${medicationsText}

📍 Address: ${user?.address?.street || ''} ${user?.address?.city || ''} ${user?.address?.district || ''}
    `.trim();

    Alert.alert("Emergency Information", emergencyInfo, [
      { 
        text: "Share", 
        onPress: () => {
          Share.share({
            message: emergencyInfo,
            title: 'Emergency Health Information'
          });
        }
      },
      { text: "Close" }
    ]);
  };

  const formatHealthCardId = (id) => {
    if (!id) return 'Not Available';
    return id.match(/.{1,4}/g)?.join(' ') || id;
  };

  const getDataCompleteness = () => {
    let completed = 0;
    let total = 10;
    
    if (user?.healthCardId) completed++;
    if (user?.phone) completed++;
    if (user?.bloodGroup) completed++;
    if (user?.emergencyContact?.phone) completed++;
    if (user?.address?.city) completed++;
    if (user?.allergies && user.allergies.length > 0) completed++;
    if (user?.dateOfBirth) completed++;
    if (user?.gender) completed++;
    if (user?.nic) completed++;
    if (user?.avatarUrl) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const completeness = getDataCompleteness();

  // Format allergies for display
  const getAllergiesDisplay = () => {
    if (!user?.allergies || user.allergies.length === 0) return null;
    
    return user.allergies.map(a => {
      if (typeof a === 'string') return a;
      return `${a.allergen} (${a.severity || 'unknown'})`;
    }).join(', ');
  };

  // Format chronic conditions for display
  const getChronicConditionsDisplay = () => {
    if (!user?.chronicConditions || user.chronicConditions.length === 0) return null;
    
    return user.chronicConditions.map(c => {
      if (typeof c === 'string') return c;
      return c.condition;
    }).join(', ');
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
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#5E4B91", fontSize: 14, fontWeight: "600" }}>
                Digital Health Card
              </Text>
              <Text style={{ color: "#2D0057", fontSize: 16, fontWeight: "800", marginTop: 4 }}>
                {user?.fullName || 'Patient Name'}
              </Text>
              <Text style={{ color: "#5E4B91", fontSize: 12, marginTop: 2 }}>
                {user?.email || 'No email'}
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

          {/* Data Completeness Indicator */}
          <View style={{ 
            width: '100%', 
            backgroundColor: 'rgba(255,255,255,0.3)', 
            padding: 12, 
            borderRadius: 12,
            marginBottom: 12
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: "#2D0057", fontSize: 12, fontWeight: "600" }}>
                Profile Completeness
              </Text>
              <Text style={{ color: "#2D0057", fontSize: 12, fontWeight: "700" }}>
                {completeness}%
              </Text>
            </View>
            <View style={{ 
              height: 6, 
              backgroundColor: 'rgba(255,255,255,0.5)', 
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <View style={{ 
                width: `${completeness}%`, 
                height: '100%', 
                backgroundColor: completeness === 100 ? '#22C55E' : '#2D0057',
                borderRadius: 3
              }} />
            </View>
          </View>

          {/* Info */}
          <Text style={{ 
            color: "#5E4B91", 
            fontSize: 14, 
            textAlign: 'center',
            lineHeight: 20
          }}>
            Scan this QR code at hospital check-in for instant access to your complete medical profile
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
              <Ionicons name="medical" size={20} color="#EF4444" />
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
                  {user?.emergencyContact?.name || 'Not set'}
                </Text>
              </View>

              {getAllergiesDisplay() && (
                <View style={{ marginBottom: 12, width: '100%' }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Known Allergies</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: '#EF4444' }}>
                    {getAllergiesDisplay()}
                  </Text>
                </View>
              )}

              {getChronicConditionsDisplay() && (
                <View style={{ marginBottom: 12, width: '100%' }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Chronic Conditions</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: '#F59E0B' }}>
                    {getChronicConditionsDisplay()}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={{ fontSize: 12, color: colors.primary, textAlign: 'center', marginTop: 8 }}>
              Tap to view full emergency information
            </Text>
          </TouchableOpacity>

          {/* QR Code Data Summary */}
          <View style={{
            backgroundColor: `${colors.primary}08`,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: `${colors.primary}20`,
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
              QR Code Contains
            </Text>
            
            {[
              { icon: "person", text: "Full personal details & contact info" },
              { icon: "location", text: "Complete address information" },
              { icon: "water", text: "Blood group & medical alerts" },
              { icon: "medkit", text: "Allergies (with severity levels)" },
              { icon: "fitness", text: "Chronic conditions & status" },
              { icon: "medical", text: "Current medications & dosages" },
              { icon: "call", text: "Emergency contact details" },
              { icon: "shield-checkmark", text: "Insurance information" },
              { icon: "time", text: "Medical history & last visit" }
            ].map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name={item.icon} size={14} color={colors.white} />
                </View>
                <Text style={{ fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 }}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* How to Use */}
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
              How to Use Your Health Card
            </Text>
            
            {[
              "Present QR code at hospital reception desk",
              "Staff will scan to access your medical profile instantly",
              "All allergies, conditions & medications will be visible",
              "No need to fill forms or repeat medical history"
            ].map((instruction, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: "700", 
                  color: colors.primary, 
                  marginRight: 8,
                  minWidth: 20
                }}>
                  {index + 1}.
                </Text>
                <Text style={{ fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 }}>
                  {instruction}
                </Text>
              </View>
            ))}
          </View>

          {/* Security Notice */}
          <View style={{
            backgroundColor: '#FFF3CD',
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            borderWidth: 1,
            borderColor: '#FFE69C'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="shield-checkmark" size={18} color="#856404" />
              <Text style={{ 
                fontSize: 13, 
                color: '#856404', 
                marginLeft: 8,
                flex: 1,
                lineHeight: 18
              }}>
                Your QR code contains sensitive medical information. Only share with authorized healthcare providers.
              </Text>
            </View>
          </View>

          {/* Database Info */}
          <View style={{
            backgroundColor: `${colors.success}10`,
            borderRadius: 12,
            padding: 16,
            marginTop: 12,
            borderWidth: 1,
            borderColor: `${colors.success}30`
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={{ 
                fontSize: 12, 
                color: colors.success, 
                marginLeft: 8,
                flex: 1,
                lineHeight: 16
              }}>
                Synced with hospital database • Patient ID: {user?.id?.slice(-8) || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Last Updated */}
          <Text style={{ 
            fontSize: 12, 
            color: colors.textMuted, 
            textAlign: 'center', 
            marginTop: 20
          }}>
            Digital Health Card v2.0 • Generated {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}