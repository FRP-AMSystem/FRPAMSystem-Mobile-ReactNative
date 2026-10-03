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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../constants/colors";
import { Role } from "../types/auth";
import { CreateUserPayload } from "../types/user";
import { getRoles } from "../api/roleApi";
import { styles } from "./CreateUserModal.styles";

interface CreateUserModalProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload) => Promise<void>;
}

interface RoleConfig {
  id: number;
  name: Role;
  label: string;
  description: string;
}

function getRoleLabel(roleName: string): string {
  const r = roleName.toLowerCase();
  if (r.includes("admin")) return "Administrator";
  if (r.includes("manager")) return "Manager";
  if (r.includes("research")) return "Researcher";
  if (r.includes("tech")) return "Technician";
  if (r.includes("season")) return "Seasonal Worker";
  if (r.includes("student")) return "Student / Intern";
  return roleName;
}

function getRoleDescription(roleName: string): string {
  const r = roleName.toLowerCase();
  if (r.includes("admin")) return "Full system & account administration";
  if (r.includes("manager")) return "Approve experiments, plans & resources";
  if (r.includes("research")) return "Draft experiments & optimize allocations";
  if (r.includes("tech")) return "Operate & maintain specialized equipment";
  if (r.includes("season")) return "Perform shift-based field tasks";
  if (r.includes("student")) return "Participate in research & internships";
  return "System member";
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  visible,
  loading = false,
  onClose,
  onSubmit,
}) => {
  const insets = useSafeAreaInsets();

  const [roles, setRoles] = useState<RoleConfig[]>([]);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleConfig | null>(null);

  useEffect(() => {
    if (visible) {
      getRoles().then((data) => {
        if (data && data.length > 0) {
          const mapped: RoleConfig[] = data.map((r) => {
            const roleName = (r.roleName || "Researcher") as Role;
            return {
              id: r.roleId,
              name: roleName,
              label: getRoleLabel(roleName),
              description: r.description || getRoleDescription(roleName),
            };
          });
          setRoles(mapped);
          setSelectedRole(mapped.find((m) => m.name === "Researcher") || mapped[0]);
        }
      }).catch((e) => console.warn("Fetch roles error:", e));
    }
  }, [visible]);

  const resetForm = () => {
    setFullName("");
    setUsername("");
    setEmail("");
    setPassword("");
    if (roles.length > 0) {
      setSelectedRole(roles.find((m) => m.name === "Researcher") || roles[0]);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter the full name.");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Error", "Please enter the username.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    const payload: CreateUserPayload = {
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      roleId: selectedRole?.id || 3,
      roleName: selectedRole?.name || "Researcher",
    };

    await onSubmit(payload);
    resetForm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.modalContent,
            { paddingBottom: Math.max(insets.bottom + 16, 24) },
          ]}
        >
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Ionicons name="person-add" size={22} color={Colors.primary} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Create User Account</Text>
              <Text style={styles.subtitle}>
                Add new personnel to the FRPAM system
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
          >
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Username */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Username <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="at-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. john.doe"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Work Email <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. john.doe@forestry.vn"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Initial Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Select Role */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Role & Permission <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.roleGrid}>
                {roles.map((r) => {
                  const isSelected = selectedRole?.id === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.roleOption,
                        isSelected && styles.roleOptionSelected,
                      ]}
                      onPress={() => setSelectedRole(r)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.roleBadge,
                          isSelected && styles.roleBadgeSelected,
                        ]}
                      />
                      <View style={styles.roleTextWrap}>
                        <Text
                          style={[
                            styles.roleName,
                            isSelected && styles.roleNameSelected,
                          ]}
                        >
                          {r.label}
                        </Text>
                        <Text style={styles.roleDesc} numberOfLines={1}>
                          {r.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Create User</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
