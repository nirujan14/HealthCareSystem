import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  RefreshControl, 
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

export default function AppointmentsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  
  // Reschedule modal state
  const [rescheduleModal, setRescheduleModal] = useState({
    visible: false,
    appointmentId: null,
    hospitalName: "",
    currentDate: new Date()
  });
  const [newDate, setNewDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadAppointments = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const { data } = await client.get("/appointments");
      setItems(data);
    } catch (error) {
      console.error("Failed to load appointments:", error);
      
      let errorMessage = "Failed to load appointments";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    loadAppointments(); 
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "BOOKED":
        return colors.primary;
      case "COMPLETED":
        return colors.success;
      case "CANCELLED":
        return colors.danger;
      case "CONFIRMED":
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "BOOKED":
        return "Booked";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      case "CONFIRMED":
        return "Confirmed";
      default:
        return status;
    }
  };

  const handleCancel = async (id, hospitalName) => {
    Alert.alert(
      "Cancel Appointment",
      `Are you sure you want to cancel your appointment at ${hospitalName}?`,
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingId(id);
              
              // Make the cancel request
              const response = await client.patch(`/appointments/${id}/cancel`);
              
              if (response.status === 200) {
                await loadAppointments();
                Alert.alert("Success", "Appointment cancelled successfully");
              }
            } catch (error) {
              console.error("Cancel failed:", error);
              
              // Better error messages
              let errorMessage = "Failed to cancel appointment";
              
              if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
              } else if (error.request) {
                errorMessage = "Network error. Please check your connection.";
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              Alert.alert("Error", errorMessage);
            } finally {
              setCancellingId(null);
            }
          }
        }
      ]
    );
  };

  const handleReschedule = (appointmentId, hospitalName, currentDate) => {
    const appointmentDate = new Date(currentDate);
    
    // Set new date to at least tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
    
    setRescheduleModal({
      visible: true,
      appointmentId,
      hospitalName,
      currentDate: appointmentDate
    });
    
    // Set new date to tomorrow or current appointment date if it's in the future
    setNewDate(appointmentDate > tomorrow ? appointmentDate : tomorrow);
  };

  const confirmReschedule = async () => {
    // Validate new date
    if (newDate <= new Date()) {
      Alert.alert("Invalid Date", "Please select a future date and time.");
      return;
    }

    try {
      setRescheduling(true);
      
      const response = await client.patch(
        `/appointments/${rescheduleModal.appointmentId}/reschedule`,
        { newDate: newDate.toISOString() }
      );
      
      if (response.status === 200) {
        setRescheduleModal({ 
          visible: false, 
          appointmentId: null, 
          hospitalName: "", 
          currentDate: new Date() 
        });
        await loadAppointments();
        Alert.alert("Success", "Appointment rescheduled successfully");
      }
    } catch (error) {
      console.error("Reschedule failed:", error);
      
      let errorMessage = "Failed to reschedule appointment";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setRescheduling(false);
    }
  };

  const closeRescheduleModal = () => {
    setRescheduleModal({ 
      visible: false, 
      appointmentId: null, 
      hospitalName: "", 
      currentDate: new Date() 
    });
    setShowDatePicker(false);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const renderAppointmentItem = ({ item }) => {
    const { date, time } = formatDateTime(item.date);
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);

    // Extract hospital and department names safely
    const hospitalName = item.hospital?.name || item.hospital || "Unknown Hospital";
    const departmentName = item.department?.name || item.department || "General";

    return (
      <PCard style={{ marginBottom: 16, padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: "800", 
              color: colors.text,
              marginBottom: 4 
            }}>
              {hospitalName}
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: colors.textMuted,
              marginBottom: 8 
            }}>
              {departmentName}
            </Text>
          </View>
          
          {/* Status Badge */}
          <View style={{ 
            backgroundColor: `${statusColor}15`,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: statusColor
          }}>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: "600", 
              color: statusColor 
            }}>
              {statusText}
            </Text>
          </View>
        </View>

        {/* Date & Time */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginTop: 12,
          padding: 12,
          backgroundColor: `${colors.primary}08`,
          borderRadius: 8
        }}>
          <View style={{ marginRight: 16 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 2 }}>DATE</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{date}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 2 }}>TIME</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{time}</Text>
          </View>
        </View>

        {/* Doctor Info (if available) */}
        {item.doctor && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginTop: 12,
            paddingVertical: 8
          }}>
            <View style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 16, 
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}>
              <Text style={{ color: colors.white, fontWeight: '600', fontSize: 14 }}>
                {item.doctor.fullName?.charAt(0) || item.doctor.name?.charAt(0) || 'D'}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                Dr. {item.doctor.fullName || item.doctor.name || "Doctor"}
              </Text>
              {item.doctor.specialization && (
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {item.doctor.specialization}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Appointment Number */}
        {item.appointmentNumber && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              Appointment No: {item.appointmentNumber}
            </Text>
          </View>
        )}

        {/* Actions */}
        {item.status === "BOOKED" && (
          <View style={{ marginTop: 16, flexDirection: 'row', gap: 12 }}>
            <PButton 
              title="Cancel" 
              type="outline" 
              onPress={() => handleCancel(item._id, hospitalName)} 
              style={{ flex: 1 }}
              loading={cancellingId === item._id}
              disabled={cancellingId !== null || rescheduling}
              textStyle={{ color: colors.danger }}
            />
            <PButton 
              title="Reschedule" 
              type="primary" 
              onPress={() => handleReschedule(item._id, hospitalName, item.date)}
              style={{ flex: 1 }}
              disabled={cancellingId !== null || rescheduling}
            />
          </View>
        )}
      </PCard>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMuted }}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        renderItem={renderAppointmentItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAppointments(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 40 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: "600", 
              color: colors.text, 
              marginBottom: 8,
              textAlign: 'center'
            }}>
              No Appointments
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: colors.textMuted, 
              textAlign: 'center',
              lineHeight: 20
            }}>
              You don't have any appointments scheduled yet. Book your first appointment to get started.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeRescheduleModal}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          padding: 20
        }}>
          <PCard style={{ padding: 20 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.text,
              marginBottom: 8
            }}>
              Reschedule Appointment
            </Text>
            
            <Text style={{
              fontSize: 14,
              color: colors.textMuted,
              marginBottom: 20
            }}>
              {rescheduleModal.hospitalName}
            </Text>

            {/* Current Date */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>
                Current Date & Time
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                {rescheduleModal.currentDate.toLocaleString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            {/* New Date */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>
                New Date & Time *
              </Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 16,
                  backgroundColor: colors.background
                }}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: colors.text, fontSize: 14 }}>
                  {newDate.toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={newDate}
                mode="datetime"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setNewDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <PButton
                title="Cancel"
                type="outline"
                onPress={closeRescheduleModal}
                style={{ flex: 1 }}
                disabled={rescheduling}
              />
              <PButton
                title="Confirm"
                type="primary"
                onPress={confirmReschedule}
                style={{ flex: 1 }}
                loading={rescheduling}
              />
            </View>
          </PCard>
        </View>
      </Modal>
    </View>
  );
}