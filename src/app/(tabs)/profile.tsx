import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { Colors } from "../../constants/colors";
import { styles } from "../../styles/profile.styles";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, role, logoutUser } = useAuth();

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống tác nghiệp?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await logoutUser();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const getRoleLabel = () => {
    if (role === "Technician") return "Kỹ thuật viên hiện trường (Technician)";
    if (role === "Seasonal") return "Nhân viên thời vụ (Seasonal)";
    return role || "Cán bộ tác nghiệp";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
      </View>

      <View style={styles.content}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.fullName || user?.username || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.fullName || user?.username}</Text>
          <Text style={styles.userEmail}>{user?.email || "Chưa cập nhật email"}</Text>

          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primaryDark} />
            <Text style={styles.roleBadgeText}>{getRoleLabel()}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.infoLabel}>Tên đăng nhập:</Text>
            <Text style={styles.infoValue}>{user?.username || "-"}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="briefcase-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.infoLabel}>Đơn vị công tác:</Text>
            <Text style={styles.infoValue}>Tổ Kỹ thuật & Khảo nghiệm</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="globe-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.infoLabel}>Môi trường:</Text>
            <Text style={styles.infoValue}>Hiện trường Lâm nghiệp</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#b91c1c" />
          <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
