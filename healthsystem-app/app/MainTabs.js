import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';
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
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ios-home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={AppointmentsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ios-calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Book" 
        component={BookAppointmentScreen} 
        options={{ 
          title: "Book",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ios-add-circle" size={size} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Records" 
        component={RecordsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ios-folder" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="HealthCard" 
        component={HealthCardScreen}
        options={{
          title: "Health Card",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ios-card" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ios-person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}