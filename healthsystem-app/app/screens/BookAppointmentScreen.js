import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import PCard from "../../src/components/PCard";
import PButton from "../../src/components/PButton";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

export default function BookAppointmentScreen() {
  const [hospital, setHospital] = useState("NHSL");
  const [department, setDepartment] = useState("General Medicine");
  const [date, setDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const submit = async () => {
    if (!hospital || !department || !date) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await client.post("/appointments", { 
        hospital, 
        department, 
        date: date.toISOString(),
        notes: notes.trim() || undefined
      });
      
      Alert.alert("Success", "Appointment booked successfully!");
      setNotes("");
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.error || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView 
      style={{
        flex: 1, 
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 0
      }}
    >
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hospital */}
        <PCard style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "700", color: colors.text, fontSize: 16, marginBottom: 8 }}>
            Hospital *
          </Text>
          <TextInput
            value={hospital}
            onChangeText={setHospital}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              backgroundColor: colors.background,
              color: colors.text,
              fontSize: 16
            }}
            placeholder="Enter hospital name"
          />
        </PCard>

        {/* Department */}
        <PCard style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "700", color: colors.text, fontSize: 16, marginBottom: 8 }}>
            Department *
          </Text>
          <TextInput
            value={department}
            onChangeText={setDepartment}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              backgroundColor: colors.background,
              color: colors.text,
              fontSize: 16
            }}
            placeholder="Enter department"
          />
        </PCard>

        {/* Date & Time */}
        <PCard style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "700", color: colors.text, fontSize: 16, marginBottom: 8 }}>
            Date & Time *
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
            <Text style={{ color: colors.text, fontSize: 16 }}>
              {formatDisplayDate(date)}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </PCard>

        {/* Additional Notes */}
        <PCard style={{ marginBottom: 24 }}>
          <Text style={{ fontWeight: "700", color: colors.text, fontSize: 16, marginBottom: 8 }}>
            Additional Notes
          </Text>
          <TextInput
            placeholder="Any specific concerns or requirements..."
            value={notes}
            onChangeText={setNotes}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              backgroundColor: colors.background,
              color: colors.text,
              minHeight: 100,
              textAlignVertical: 'top'
            }}
            multiline
            numberOfLines={4}
          />
        </PCard>

        {/* Submit Button */}
        <PButton 
          title="Confirm Appointment" 
          onPress={submit} 
          loading={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
