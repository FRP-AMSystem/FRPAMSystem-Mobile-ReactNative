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
      console.warn("Could not fetch profile details:", err);
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
    if (currentRole === "Student") return "Student / Intern";
    if (currentRole === "Researcher") return "Lead Researcher";
    if (currentRole === "Manager") return "Operations Manager";
    if (currentRole === "Admin" || currentRole === "SystemAdmin") return "System Administrator";
    return currentRole || "Staff Member";
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      // Filter out invalid dates or default .NET DateTime.MinValue (year 0001 / < 2000)
      if (isNaN(d.getTime()) || d.getFullYear() < 2000) return null;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  const email = detailedUser?.email || user?.email || "No email provided";
  const username = detailedUser?.username || user?.username || "-";
  const fullName = detailedUser?.fullName || user?.fullName || user?.username || "User";
  const createdAt = detailedUser?.createdAt || null;
  const updatedAt = detailedUser?.updatedAt || null;
  const joinedDateFormatted = formatDate(createdAt);
  const updatedAtFormatted = formatDate(updatedAt);

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
        {/* Hero User Card */}
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

        {/* User Account Details Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Account Details</Text>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoLeft}>
                <Ionicons name="at-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.infoLabel}>Username:</Text>
              </View>
              <Text style={styles.infoValue}>@{username}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoLeft}>
                <Ionicons name="mail-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.infoLabel}>Email:</Text>
              </View>
              <Text style={styles.infoValue}>{email}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoLeft}>
                <Ionicons name="shield-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.infoLabel}>System Role:</Text>
              </View>
              <Text style={styles.infoValue}>{getRoleLabel()}</Text>
            </View>

            {joinedDateFormatted ? (
              <View style={styles.infoItem}>
                <View style={styles.infoLeft}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.infoLabel}>Joined Date:</Text>
                </View>
                <Text style={styles.infoValue}>{joinedDateFormatted}</Text>
              </View>
            ) : null}

            {updatedAtFormatted ? (
              <View style={styles.infoItem}>
                <View style={styles.infoLeft}>
                  <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.infoLabel}>Last Updated:</Text>
                </View>
                <Text style={styles.infoValue}>{updatedAtFormatted}</Text>
              </View>
            ) : null}
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
