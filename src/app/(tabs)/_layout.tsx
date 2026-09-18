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
      {/* 1. Manager: Tổng quan Dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Tổng quan",
          href: isManager ? "/(tabs)/dashboard" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 2. Admin: Quản lý Người dùng */}
      <Tabs.Screen
        name="admin-users"
        options={{
          title: "Người dùng",
          href: isAdmin ? "/(tabs)/admin-users" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 3. Admin: Nhật ký Audit */}
      <Tabs.Screen
        name="admin-logs"
        options={{
          title: "Nhật ký",
          href: isAdmin ? "/(tabs)/admin-logs" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 4. Admin: Cấu hình hệ thống */}
      <Tabs.Screen
        name="admin-settings"
        options={{
          title: "Hệ thống",
          href: isAdmin ? "/(tabs)/admin-settings" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 5. Researcher & Manager: Đề tài Thử nghiệm */}
      <Tabs.Screen
        name="experiments"
        options={{
          title: "Đề tài",
          href: isResearcher || isManager ? "/(tabs)/experiments" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flask-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 6. Researcher & Manager: Kế hoạch Phân bổ */}
      <Tabs.Screen
        name="allocation-plans"
        options={{
          title: "Phân bổ",
          href: isResearcher || isManager ? "/(tabs)/allocation-plans" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="git-network-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 7. Manager: Quản lý Tài nguyên Hiện trường */}
      <Tabs.Screen
        name="resources"
        options={{
          title: "Tài nguyên",
          href: isManager ? "/(tabs)/resources" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 8. Field Staff: Quản lý Thiết bị */}
      <Tabs.Screen
        name="equipment"
        options={{
          title: "Thiết bị",
          href: !isResearcher && !isManager && !isAdmin ? "/(tabs)/equipment" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 9. Common: Lịch trực / Công tác */}
      <Tabs.Screen
        name="schedules"
        options={{
          title: "Lịch trực",
          href: isResearcher || isFieldStaff ? "/(tabs)/schedules" : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 10. Common: Thông báo */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Thông báo",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 11. Common: Cá nhân */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
