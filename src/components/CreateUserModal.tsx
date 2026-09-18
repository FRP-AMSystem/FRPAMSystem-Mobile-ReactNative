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
  if (r.includes("admin")) return "Quản trị viên";
  if (r.includes("manager")) return "Quản lý";
  if (r.includes("research")) return "Nghiên cứu viên";
  if (r.includes("tech")) return "Kỹ thuật viên";
  if (r.includes("season")) return "Thời vụ";
  if (r.includes("student")) return "Học viên";
  return roleName;
}

function getRoleDescription(roleName: string): string {
  const r = roleName.toLowerCase();
  if (r.includes("admin")) return "Toàn quyền hệ thống & tài khoản";
  if (r.includes("manager")) return "Duyệt đề tài, phân bổ & tài nguyên";
  if (r.includes("research")) return "Lập đề tài & tối ưu phân bổ";
  if (r.includes("tech")) return "Vận hành & bảo dưỡng thiết bị";
  if (r.includes("season")) return "Thực hiện nhiệm vụ theo ca";
  if (r.includes("student")) return "Tham gia đề tài & thực tập";
  return "Thành viên hệ thống";
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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");

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
    setPhoneNumber("");
    setDepartment("");
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
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên.");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên đăng nhập.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Lỗi", "Vui lòng nhập email hợp lệ.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    const payload: CreateUserPayload = {
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      roleId: selectedRole?.id || 3,
      roleName: selectedRole?.name || "Researcher",
      phoneNumber: phoneNumber.trim() || undefined,
      department: department.trim() || undefined,
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
              <Text style={styles.title}>Tạo tài khoản người dùng</Text>
              <Text style={styles.subtitle}>
                Thêm nhân sự mới vào hệ thống FRPAM
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
            {/* Họ và tên */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Họ và tên <Text style={styles.required}>*</Text>
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
                  placeholder="Ví dụ: Nguyễn Văn An"
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Tên đăng nhập */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Tên đăng nhập <Text style={styles.required}>*</Text>
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
                  placeholder="Ví dụ: an.nguyen"
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
                Email công vụ <Text style={styles.required}>*</Text>
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
                  placeholder="Ví dụ: an.nguyen@forestry.vn"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Mật khẩu */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Mật khẩu khởi tạo <Text style={styles.required}>*</Text>
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
                  placeholder="Tối thiểu 6 ký tự"
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

            {/* Chọn vai trò */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Vai trò phân quyền <Text style={styles.required}>*</Text>
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

            {/* Số điện thoại */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Số điện thoại (Tùy chọn)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 0987654321"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
            </View>

            {/* Bộ môn / Phòng ban */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Bộ môn / Phòng ban (Tùy chọn)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Bộ môn Giống cây rừng"
                  placeholderTextColor="#94a3b8"
                  value={department}
                  onChangeText={setDepartment}
                />
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
              <Text style={styles.cancelBtnText}>Hủy</Text>
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
                  <Text style={styles.submitBtnText}>Tạo tài khoản</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
