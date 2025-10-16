import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  RefreshControl, 
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext"; // Add this import
import PCard from "../../src/components/PCard";
import colors from "../../src/constants/colors";
import client from "../../src/api/client";

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Records' },
  { id: 'recent', label: 'Last 30 Days' },
  { id: 'tests', label: 'Lab Tests' },
  { id: 'consultations', label: 'Consultations' },
];

export default function RecordsScreen() {
  const { user } = useAuth(); // Add this line to get user from context
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedRecord, setExpandedRecord] = useState(null);

  const loadRecords = async (showRefresh = false) => {
  try {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    // Change to generic endpoint that handles patient access automatically
    const { data } = await client.get("/records");
    
    // Rest of your transformation code...
    const transformedRecords = data.map(record => ({
      _id: record._id,
      hospital: record.hospital?.name || 'Unknown Hospital',
      department: record.department?.name || 'General',
      visitDate: record.visitDate,
      diagnosis: record.diagnosis?.primary?.condition || 'No diagnosis',
      prescription: record.prescriptions?.length > 0 
        ? record.prescriptions.map(p => `${p.medicationName} - ${p.dosage}`).join(', ')
        : 'No prescription',
      notes: record.clinicalNotes,
      doctor: {
        name: record.attendingDoctor?.fullName || 'Unknown Doctor',
        specialization: record.attendingDoctor?.specialization || 'General'
      }
    }));
    
    setRecords(transformedRecords);
    setFilteredRecords(transformedRecords);
  } catch (error) {
    console.error("Failed to load records:", error);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => { 
    if (user?.id) {
      loadRecords(); 
    } else {
      setLoading(false);
      console.log("No user found, skipping records load");
    }
  }, [user]); // Add user as dependency

  useEffect(() => {
    filterRecords();
  }, [searchQuery, activeFilter, records]);

  const filterRecords = () => {
    let filtered = [...records];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.hospital?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.prescription?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (activeFilter === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(record => new Date(record.visitDate) > thirtyDaysAgo);
    } else if (activeFilter === 'tests') {
      filtered = filtered.filter(record => 
        record.department?.toLowerCase().includes('lab') ||
        record.department?.toLowerCase().includes('test')
      );
    } else if (activeFilter === 'consultations') {
      filtered = filtered.filter(record => 
        !record.department?.toLowerCase().includes('lab') &&
        !record.department?.toLowerCase().includes('test')
      );
    }

    setFilteredRecords(filtered);
  };

  const toggleExpandRecord = (recordId) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDepartmentColor = (department) => {
    const dept = department?.toLowerCase() || '';
    if (dept.includes('cardio')) return '#FF6B6B';
    if (dept.includes('neuro')) return '#4ECDC4';
    if (dept.includes('ortho')) return '#FFA726';
    if (dept.includes('dental')) return '#26C6DA';
    if (dept.includes('lab')) return '#9575CD';
    return colors.primary;
  };

  const renderRecordItem = ({ item }) => {
    const isExpanded = expandedRecord === item._id;
    const departmentColor = getDepartmentColor(item.department);

    return (
      <PCard style={{ marginBottom: 16 }}>
        {/* Header */}
        <TouchableOpacity onPress={() => toggleExpandRecord(item._id)}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: departmentColor,
                  marginRight: 8
                }} />
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: "700", 
                  color: colors.text,
                  flex: 1 
                }}>
                  {item.hospital}
                </Text>
              </View>
              <Text style={{ 
                fontSize: 14, 
                color: colors.textMuted,
                marginBottom: 4 
              }}>
                {item.department}
              </Text>
              <Text style={{ 
                fontSize: 12, 
                color: colors.textMuted 
              }}>
                {formatDate(item.visitDate)}
              </Text>
            </View>
            
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.textMuted} 
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
            {/* Diagnosis */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                Diagnosis
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: colors.text,
                lineHeight: 20,
                backgroundColor: `${colors.primary}08`,
                padding: 12,
                borderRadius: 8
              }}>
                {item.diagnosis || "No diagnosis recorded"}
              </Text>
            </View>

            {/* Prescription */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                Prescription
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: colors.text,
                lineHeight: 20,
                backgroundColor: `${colors.primary}08`,
                padding: 12,
                borderRadius: 8
              }}>
                {item.prescription || "No prescription provided"}
              </Text>
            </View>

            {/* Additional Notes */}
            {item.notes && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                  Additional Notes
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text,
                  lineHeight: 20,
                  backgroundColor: `${colors.primary}08`,
                  padding: 12,
                  borderRadius: 8
                }}>
                  {item.notes}
                </Text>
              </View>
            )}

            {/* Doctor Info */}
            {item.doctor && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginTop: 8,
                padding: 12,
                backgroundColor: `${colors.primary}05`,
                borderRadius: 8
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
                  <Text style={{ color: colors.white, fontWeight: '600', fontSize: 12 }}>
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
          </View>
        )}
      </PCard>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMuted }}>Loading medical records...</Text>
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
      {/* Search Bar */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 12
        }}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            placeholder="Search records by hospital, department, diagnosis..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              padding: 12,
              color: colors.text,
              fontSize: 14
            }}
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ paddingHorizontal: 16, marginBottom: 8 }}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            onPress={() => setActiveFilter(filter.id)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeFilter === filter.id ? colors.primary : `${colors.primary}10`,
              marginRight: 8
            }}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: activeFilter === filter.id ? colors.white : colors.primary
            }}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Records List */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item._id}
        renderItem={renderRecordItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRecords(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 40 }}>
            <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
            <Text style={{ 
              fontSize: 18, 
              fontWeight: "600", 
              color: colors.text, 
              marginTop: 16,
              marginBottom: 8,
              textAlign: 'center'
            }}>
              {user ? "No Records Found" : "Please Login"}
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: colors.textMuted, 
              textAlign: 'center',
              lineHeight: 20
            }}>
              {!user ? "Please log in to view your medical records" :
               searchQuery || activeFilter !== 'all' 
                ? "Try adjusting your search or filter criteria"
                : "Your medical records will appear here after your first visit"
              }
            </Text>
            {!user && (
              <TouchableOpacity 
                style={{
                  marginTop: 16,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: colors.primary,
                  borderRadius: 8
                }}
                onPress={() => {
                  // Navigate to login screen
                  // navigation.navigate('Login');
                }}
              >
                <Text style={{ color: colors.white, fontWeight: '600' }}>
                  Go to Login
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}