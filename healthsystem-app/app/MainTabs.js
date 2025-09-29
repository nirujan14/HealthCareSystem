import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DashboardScreen from "./screens/DashboardScreen";
import AppointmentsScreen from "./screens/AppointmentsScreen";
import BookAppointmentScreen from "./screens/BookAppointmentScreen";
import RecordsScreen from "./screens/RecordsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import HealthCardScreen from "./screens/HealthCardScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Book" component={BookAppointmentScreen} options={{ title: "Book" }} />
      <Tab.Screen name="Records" component={RecordsScreen} />
      <Tab.Screen name="HealthCard" component={HealthCardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
