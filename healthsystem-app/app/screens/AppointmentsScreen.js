import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  RefreshControl, 
  Alert,
  ActivityIndicator 
} from "react-native";
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

export default function AppointmentsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

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
      Alert.alert("Error", "Failed to load appointments");
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

  const handleCancel = async (id, hospital) => {
    Alert.alert(
      "Cancel Appointment",
      `Are you sure you want to cancel your appointment at ${hospital}?`,
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingId(id);
              await client.patch(`/appointments/${id}/cancel`);
              await loadAppointments();
              Alert.alert("Success", "Appointment cancelled successfully");
            } catch (error) {
              console.error("Cancel failed:", error);
              Alert.alert("Error", "Failed to cancel appointment");
            } finally {
              setCancellingId(null);
            }
          }
        }
      ]
    );
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
              {item.hospital}
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: colors.textMuted,
              marginBottom: 8 
            }}>
              {item.department}
            </Text>
          </View>
          
          {/* Status Badge */}
          <View style={{ 
            backgroundColor: `${statusColor}15`, // 15% opacity
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
                {item.doctor.name?.charAt(0) || 'D'}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                Dr. {item.doctor.name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {item.doctor.specialization}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {item.status === "BOOKED" && (
          <View style={{ marginTop: 16, flexDirection: 'row', gap: 12 }}>
            <PButton 
              title="Cancel Appointment" 
              type="outline" 
              onPress={() => handleCancel(item._id, item.hospital)} 
              style={{ flex: 1 }}
              loading={cancellingId === item._id}
              disabled={cancellingId !== null}
            />
            <PButton 
              title="Reschedule" 
              type="primary" 
              onPress={() => {/* Add reschedule logic */}}
              style={{ flex: 1 }}
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
    </View>
  );
}