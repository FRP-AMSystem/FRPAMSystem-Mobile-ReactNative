import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isAdmin, isManager, isResearcher, isFieldStaff } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      {/* 1. Manager: Overview Dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          href: isManager ? "/(tabs)/dashboard" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 2. Admin: User Management */}
      <Tabs.Screen
        name="admin-users"
        options={{
          title: "Users",
          href: isAdmin ? "/(tabs)/admin-users" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 3. Admin: Audit Logs */}
      <Tabs.Screen
        name="admin-logs"
        options={{
          title: "Audit Logs",
          href: isAdmin ? "/(tabs)/admin-logs" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 4. Admin: System Settings */}
      <Tabs.Screen
        name="admin-settings"
        options={{
          title: "Settings",
          href: isAdmin ? "/(tabs)/admin-settings" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 5. Researcher & Manager: Experiments */}
      <Tabs.Screen
        name="experiments"
        options={{
          title: "Experiments",
          href: isResearcher || isManager ? "/(tabs)/experiments" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flask-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 6. Researcher & Manager: Allocation Plans */}
      <Tabs.Screen
        name="allocation-plans"
        options={{
          title: "Allocations",
          href: isResearcher || isManager ? "/(tabs)/allocation-plans" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-network-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 7. Manager: Field Resources */}
      <Tabs.Screen
        name="resources"
        options={{
          title: "Resources",
          href: isManager ? "/(tabs)/resources" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 8. Common: Duty / Work Schedules */}
      <Tabs.Screen
        name="schedules"
        options={{
          title: "Schedules",
          href: isResearcher || isFieldStaff ? "/(tabs)/schedules" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 9. Field Staff: Equipment Management */}
      <Tabs.Screen
        name="equipment"
        options={{
          title: "Equipment",
          href: !isResearcher && !isManager && !isAdmin ? "/(tabs)/equipment" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 10. Common: Notifications */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 11. Common: Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
