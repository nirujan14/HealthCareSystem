import React from "react";
import { View, Platform, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import DashboardScreen from "./screens/DashboardScreen";
import AppointmentsScreen from "./screens/AppointmentsScreen";
import BookAppointmentScreen from "./screens/BookAppointmentScreen";
import RecordsScreen from "./screens/RecordsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import HealthCardScreen from "./screens/HealthCardScreen";
import colors from "../src/constants/colors";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        
        // 💜 Enhanced gradient background
        tabBarBackground: () => (
          <LinearGradient
            colors={["#F6EEFF", "#EDE3FF", "#E5D8FF"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBackground}
          />
        ),

        // 🧭 Enhanced bar styling
        tabBarStyle: styles.tabBar,
        
        // 🏷 Label and icon styling
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveTintColor: colors.primary || "#7A3EF0",
        tabBarInactiveTintColor: "#8E8E93",
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Book"
        component={BookAppointmentScreen}
        options={{
          title: "Book",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "add" : "add-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Records"
        component={RecordsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "folder" : "folder-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="HealthCard"
        component={HealthCardScreen}
        options={{
          title: "Health Card",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "card" : "card-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={23}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tabBar: {
    position: "absolute",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Platform.OS === "ios" ? 88 : 78,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    paddingTop: 10,
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: "#7A3EF0",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    marginBottom: 0,
    borderWidth: 1,
    borderColor: "rgba(122, 62, 240, 0.1)",
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
});