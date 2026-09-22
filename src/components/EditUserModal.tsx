import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserItem, UpdateUserPayload } from "../types/user";
import { RoleItem } from "../types/role";
import { getRoles } from "../api/roleApi";
import { updateUser } from "../api/userApi";
import { styles } from "./EditUserModal.styles";

interface EditUserModalProps {
  visible: boolean;
  user: UserItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserModal({
  visible,
  user,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number>(3);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setPhoneNumber(user.phoneNumber || "");
      setDepartment(user.department || "");
      setSelectedRoleId(Number(user.roleId || 3));
      setIsActive(user.isActive !== false);

      getRoles()
        .then((data) => {
          if (data && data.length > 0) {
            setRoles(data);
          }
        })
        .catch((e) => console.warn("Fetch roles error:", e));
    }
  }, [visible, user]);

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter the full name.");
      return;
    }

    try {
      setSaving(true);
      const payload: UpdateUserPayload = {
        fullName: fullName.trim(),
        email: email.trim() ? email.trim().toLowerCase() : undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        department: department.trim() || undefined,
        roleId: selectedRoleId,
        isActive: isActive,
      };

      await updateUser(user.userId, payload);
      Alert.alert(
        "Success",
        `User account "${user.username}" has been updated (Status: ${
          isActive ? "Active" : "Inactive"
        })!`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Update user error:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Failed to update user account. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!visible || !user) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalCard}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Edit User Profile</Text>
                  <Text style={styles.modalSubtitle}>
                    {user.fullName || user.username}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <ScrollView
                contentContainerStyle={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Full Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. John Doe"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Username (Read-only) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Username (Read-only) <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.readOnlyBox}>
                    <Text style={styles.readOnlyText}>{user.username}</Text>
                  </View>
                </View>

                {/* Role */}
                {roles.length > 0 && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      Role <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.roleGrid}>
                      {roles.map((r) => {
                        const isSelected = selectedRoleId === r.roleId;
                        return (
                          <TouchableOpacity
                            key={r.roleId}
                            style={[
                              styles.roleOption,
                              isSelected && styles.roleOptionSelected,
                            ]}
                            onPress={() => setSelectedRoleId(r.roleId)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.roleText,
                                isSelected && styles.roleTextSelected,
                              ]}
                            >
                              {r.roleName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Status (Active / Inactive) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Status <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.statusGrid}>
                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        isActive && styles.statusOptionActive,
                      ]}
                      onPress={() => setIsActive(true)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[styles.statusDot, styles.statusDotActive]}
                      />
                      <Text
                        style={[
                          styles.statusOptionText,
                          isActive && styles.statusOptionTextActive,
                        ]}
                      >
                        Active
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusOption,
                        !isActive && styles.statusOptionInactive,
                      ]}
                      onPress={() => setIsActive(false)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[styles.statusDot, styles.statusDotInactive]}
                      />
                      <Text
                        style={[
                          styles.statusOptionText,
                          !isActive && styles.statusOptionTextInactive,
                        ]}
                      >
                        Inactive
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    placeholder="admin@forestry.vn"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Phone */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholder="0912345678"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Department */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Department</Text>
                  <TextInput
                    style={styles.input}
                    value={department}
                    onChangeText={setDepartment}
                    placeholder="e.g. Forestry Research Institute"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Update User</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
