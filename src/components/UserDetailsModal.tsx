import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserItem } from "../types/user";
import { styles } from "./UserDetailsModal.styles";

interface UserDetailsModalProps {
  visible: boolean;
  user: UserItem | null;
  onClose: () => void;
  onEdit: (user: UserItem) => void;
}

function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return `${first}${last}`.toUpperCase();
}

export function UserDetailsModal({
  visible,
  user,
  onClose,
  onEdit,
}: UserDetailsModalProps) {
  if (!visible || !user) return null;

  const isActive = user.isActive !== false;
  const initials = getInitials(user.fullName || user.username);

  const getRoleBadge = (roleName?: string) => {
    const r = (roleName || "").toLowerCase();
    if (r.includes("admin")) {
      return { label: "ADMIN", bg: "#fdf2f8", text: "#db2777", border: "#fbcfe8" };
    }
    if (r.includes("manager")) {
      return { label: "MANAGER", bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
    }
    if (r.includes("researcher")) {
      return { label: "RESEARCHER", bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" };
    }
    if (r.includes("tech")) {
      return { label: "TECHNICIAN", bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
    }
    if (r.includes("season")) {
      return { label: "SEASONAL", bg: "#ecfeff", text: "#0891b2", border: "#a5f3fc" };
    }
    return { label: String(roleName || "USER").toUpperCase(), bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
  };

  const roleBadge = getRoleBadge(String(user.roleName));

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>User Details</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Profile summary banner */}
                <View style={styles.profileHeader}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.fullName}>{user.fullName || "User"}</Text>
                    <Text style={styles.username}>@{user.username}</Text>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.roleBadge,
                          { backgroundColor: roleBadge.bg, borderColor: roleBadge.border },
                        ]}
                      >
                        <Text style={[styles.roleText, { color: roleBadge.text }]}>
                          {roleBadge.label}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isActive ? "#f0fdf4" : "#fef2f2" },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: isActive ? "#16a34a" : "#dc2626" },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: isActive ? "#16a34a" : "#dc2626" },
                          ]}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Detailed key-value rows */}
                <View style={styles.detailsList}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailLabelWrap}>
                      <Ionicons name="mail-outline" size={16} color="#64748b" />
                      <Text style={styles.detailLabel}>Email</Text>
                    </View>
                    <Text style={styles.detailValue}>{user.email || "-"}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailLabelWrap}>
                      <Ionicons name="call-outline" size={16} color="#64748b" />
                      <Text style={styles.detailLabel}>Phone Number</Text>
                    </View>
                    <Text style={styles.detailValue}>{user.phoneNumber || "-"}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailLabelWrap}>
                      <Ionicons name="business-outline" size={16} color="#64748b" />
                      <Text style={styles.detailLabel}>Department</Text>
                    </View>
                    <Text style={styles.detailValue}>{user.department || "-"}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailLabelWrap}>
                      <Ionicons name="calendar-outline" size={16} color="#64748b" />
                      <Text style={styles.detailLabel}>Created Date</Text>
                    </View>
                    <Text style={styles.detailValue}>{user.createdAt || "-"}</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.closeActionBtn} onPress={onClose} activeOpacity={0.7}>
                  <Text style={styles.closeActionText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editActionBtn}
                  onPress={() => {
                    onClose();
                    onEdit(user);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={16} color="#ffffff" />
                  <Text style={styles.editActionText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
