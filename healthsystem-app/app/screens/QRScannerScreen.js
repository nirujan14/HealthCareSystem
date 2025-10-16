// QR Scanner Screen for Staff
// Path: healthsystem-app/app/screens/QRScannerScreen.js

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, Modal, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../src/constants/colors";
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import client from "../../src/api/client";

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);
    setScanning(false);

    try {
      // Parse QR code data
      const qrData = JSON.parse(data);
      const { healthCardId, patientId } = qrData;

      // Verify with backend
      const response = await client.post("/checkin/verify", {
        healthCardId,
        patientId
      });

      if (response.data.verified) {
        setPatientData(response.data);
        setShowModal(true);
        
        // Play success sound or haptic feedback
        // Vibration.vibrate(200);
      } else {
        Alert.alert("Verification Failed", "Invalid health card");
        resetScanner();
      }
    } catch (error) {
      console.error("Scan error:", error);
      Alert.alert(
        "Scan Failed", 
        error.response?.data?.error || "Unable to verify health card. Please try again."
      );
      resetScanner();
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanning(true);
    setPatientData(null);
    setShowModal(false);
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      setLoading(true);
      await client.post(`/checkin/appointment/${appointmentId}`);
      
      Alert.alert(
        "Success", 
        "Patient checked in successfully",
        [{ text: "OK", onPress: resetScanner }]
      );
    } catch (error) {
      Alert.alert(
        "Check-in Failed", 
        error.response?.data?.error || "Unable to check in patient"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-off" size={64} color={colors.textMuted} />
        <Text style={styles.permissionText}>Camera permission required</Text>
        <PButton title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scanning && (
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"]
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            <View style={styles.instructionBox}>
              <Text style={styles.instruction}>
                {loading ? "Verifying..." : "Scan Patient's QR Code"}
              </Text>
            </View>
          </View>
        </CameraView>
      )}

      {loading && !showModal && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loadingText}>Verifying health card...</Text>
        </View>
      )}

      {/* Patient Details Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetScanner}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Patient Verified</Text>
              <TouchableOpacity onPress={resetScanner}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Patient Info */}
              <PCard style={{ marginBottom: 12 }}>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{patientData?.patient.fullName}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="card" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Health Card:</Text>
                  <Text style={styles.infoValue}>{patientData?.patient.healthCardId}</Text>
                </View>

                {patientData?.patient.age && (
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                    <Text style={styles.infoLabel}>Age:</Text>
                    <Text style={styles.infoValue}>{patientData.patient.age} years</Text>
                  </View>
                )}

                {patientData?.patient.bloodGroup && (
                  <View style={styles.infoRow}>
                    <Ionicons name="water" size={20} color={colors.danger} />
                    <Text style={styles.infoLabel}>Blood Group:</Text>
                    <Text style={styles.infoValue}>{patientData.patient.bloodGroup}</Text>
                  </View>
                )}

                {patientData?.patient.phone && (
                  <View style={styles.infoRow}>
                    <Ionicons name="call" size={20} color={colors.primary} />
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{patientData.patient.phone}</Text>
                  </View>
                )}
              </PCard>

              {/* Allergies Warning */}
              {patientData?.patient.allergies?.length > 0 && (
                <PCard style={{ marginBottom: 12, backgroundColor: "#FFF3CD" }}>
                  <View style={styles.warningHeader}>
                    <Ionicons name="warning" size={24} color="#856404" />
                    <Text style={styles.warningTitle}>Allergies</Text>
                  </View>
                  {patientData.patient.allergies.map((allergy, idx) => (
                    <Text key={idx} style={styles.allergyText}>
                      • {allergy.allergen || allergy} ({allergy.severity || "Unknown"})
                    </Text>
                  ))}
                </PCard>
              )}

              {/* Today's Appointments */}
              <Text style={styles.sectionTitle}>Today's Appointments</Text>
              {patientData?.todayAppointments?.length > 0 ? (
                patientData.todayAppointments.map((apt) => (
                  <PCard key={apt._id} style={{ marginBottom: 12 }}>
                    <Text style={styles.aptDept}>{apt.department?.name}</Text>
                    {apt.doctor && (
                      <Text style={styles.aptDoctor}>Dr. {apt.doctor.fullName}</Text>
                    )}
                    <Text style={styles.aptTime}>
                      {new Date(apt.date).toLocaleTimeString()}
                    </Text>
                    <Text style={styles.aptStatus}>Status: {apt.status}</Text>
                    
                    {["BOOKED", "CONFIRMED"].includes(apt.status) && (
                      <PButton
                        title="Check In"
                        onPress={() => handleCheckIn(apt._id)}
                        disabled={loading}
                        style={{ marginTop: 12, backgroundColor: colors.success }}
                      />
                    )}
                  </PCard>
                ))
              ) : (
                <Text style={styles.noAppointments}>No appointments scheduled for today</Text>
              )}
            </ScrollView>

            <PButton
              title="Scan Another"
              onPress={resetScanner}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center"
  },
  camera: {
    flex: 1,
    width: "100%"
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  scanArea: {
    width: 250,
    height: 250,
    position: "relative"
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: colors.white,
    borderWidth: 3
  },
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  instructionBox: {
    position: "absolute",
    bottom: 100,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8
  },
  instruction: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600"
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    color: colors.white,
    marginTop: 12,
    fontSize: 16
  },
  permissionText: {
    fontSize: 16,
    color: colors.textMuted,
    marginVertical: 20,
    textAlign: "center"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%"
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text
  },
  modalBody: {
    maxHeight: 500
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 8,
    width: 100
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flex: 1
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#856404",
    marginLeft: 8
  },
  allergyText: {
    fontSize: 14,
    color: "#856404",
    marginLeft: 32,
    marginBottom: 4
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    marginTop: 8
  },
  aptDept: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
  },
  aptDoctor: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4
  },
  aptTime: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4
  },
  aptStatus: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4
  },
  noAppointments: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 20
  }
});