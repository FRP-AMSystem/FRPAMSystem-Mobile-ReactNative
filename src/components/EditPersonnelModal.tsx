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
import { HumanResourceProfile, HumanResourceStatus } from "../types/personnel";
import { updateHumanResourceProfile } from "../api/personnelApi";
import { styles } from "./EditPersonnelModal.styles";

interface EditPersonnelModalProps {
  visible: boolean;
  profile: HumanResourceProfile | null;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS: { key: HumanResourceStatus; label: string }[] = [
  { key: "Available", label: "Available" },
  { key: "Busy", label: "Busy" },
  { key: "Unavailable", label: "Unavailable" },
  { key: "Inactive", label: "Inactive" },
];

export function EditPersonnelModal({
  visible,
  profile,
  onClose,
  onSuccess,
}: EditPersonnelModalProps) {
  const [status, setStatus] = useState<HumanResourceStatus>("Available");
  const [maxHours, setMaxHours] = useState("8");
  const [currentWorkload, setCurrentWorkload] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setStatus(profile.status || "Available");
      setMaxHours(String(profile.maxWorkingHoursPerDay ?? 8));
      setCurrentWorkload(String(profile.currentWorkload ?? 0));
    }
  }, [visible, profile]);

  const handleSave = async () => {
    if (!profile) return;
    const hoursNum = Number(maxHours);
    const workloadNum = Number(currentWorkload);

    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      Alert.alert("Lỗi", "Số giờ làm việc tối đa trong ngày không hợp lệ (1 - 24 giờ).");
      return;
    }
    if (isNaN(workloadNum) || workloadNum < 0) {
      Alert.alert("Lỗi", "Khối lượng công việc (Workload) không hợp lệ.");
      return;
    }

    try {
      setSaving(true);
      await updateHumanResourceProfile(profile.humanResourceId, {
        userId: profile.userId,
        maxWorkingHoursPerDay: hoursNum,
        currentWorkload: workloadNum,
        status,
      });

      Alert.alert("Thành công", `Đã cập nhật hồ sơ nhân sự "${profile.fullName || ""}"!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Update profile error:", err);
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Không thể cập nhật hồ sơ nhân sự. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!visible || !profile) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
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
                  <Text style={styles.modalTitle}>Edit Human Resource Profile</Text>
                  <Text style={styles.modalSubtitle}>{profile.fullName || "Nhân sự"}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Personnel User (Read-only) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Personnel User <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.readOnlyBox}>
                    <Text style={styles.readOnlyText}>
                      {profile.fullName || "Nhân sự"} {profile.roleName ? `(${profile.roleName})` : ""}
                    </Text>
                  </View>
                </View>

                {/* Status */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Status <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.statusGrid}>
                    {STATUS_OPTIONS.map((opt) => {
                      const isActive = status === opt.key;
                      return (
                        <TouchableOpacity
                          key={opt.key}
                          style={[styles.statusOption, isActive && styles.statusOptionActive]}
                          onPress={() => setStatus(opt.key)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.statusOptionText,
                              isActive && styles.statusOptionTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Maximum Working Hours/Day */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Maximum Working Hours/Day <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={maxHours}
                    onChangeText={setMaxHours}
                    keyboardType="numeric"
                    placeholder="8"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Current Workload */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Current Workload <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={currentWorkload}
                    onChangeText={setCurrentWorkload}
                    keyboardType="numeric"
                    placeholder="0"
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
                    <Text style={styles.saveBtnText}>Save Changes</Text>
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
