import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../api/userApi";
import { UserItem } from "../../types/user";
import { Colors } from "../../constants/colors";
import { styles } from "../../styles/profile.styles";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, role, logoutUser } = useAuth();
  const [detailedUser, setDetailedUser] = useState<UserItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileDetails = async () => {
    if (!user?.userId) return;
    try {
      const data = await getUserById(user.userId);
      if (data) {
        setDetailedUser(data);
      }
    } catch (err) {
      console.warn("Could not fetch extended profile details:", err);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [user?.userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileDetails();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of the system?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logoutUser();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const getRoleLabel = () => {
    const currentRole = detailedUser?.roleName || role;
    if (currentRole === "Technician") return "Field Technician";
    if (currentRole === "Seasonal") return "Seasonal Worker";
    if (currentRole === "Researcher") return "Lead Researcher";
    if (currentRole === "Manager") return "Operations Manager";
    if (currentRole === "Admin" || currentRole === "SystemAdmin") return "System Administrator";
    return currentRole || "Staff Member";
  };

  const email = detailedUser?.email || user?.email || "No email provided";
  const username = detailedUser?.username || user?.username || "-";
  const fullName = detailedUser?.fullName || user?.fullName || user?.username || "User";
  const phoneNumber = detailedUser?.phoneNumber || user?.phoneNumber || "Not provided";
  const department = detailedUser?.department || user?.department || "Field Operations";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{email}</Text>

          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primaryDark} />
            <Text style={styles.roleBadgeText}>{getRoleLabel()}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.infoLabel}>Username:</Text>
            <Text style={styles.infoValue}>{username}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.infoLabel}>Phone Number:</Text>
            <Text style={styles.infoValue}>{phoneNumber}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="business-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.infoLabel}>Department:</Text>
            <Text style={styles.infoValue}>{department}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" />
            <Text style={styles.infoLabel}>Account Status:</Text>
            <Text style={[styles.infoValue, { color: "#16a34a" }]}>Active</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#b91c1c" />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
