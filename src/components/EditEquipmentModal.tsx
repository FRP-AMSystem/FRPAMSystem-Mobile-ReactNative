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
import { EquipmentItem, EquipmentRequest } from "../types/equipment";
import { EquipmentTypeItem, getEquipmentTypes } from "../api/equipmentTypeApi";
import { createEquipment, updateEquipment } from "../api/equipmentApi";
import { styles } from "./EditEquipmentModal.styles";

interface EditEquipmentModalProps {
  visible: boolean;
  equipment: EquipmentItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { key: "Available", label: "Available" },
  { key: "InUse", label: "InUse" },
  { key: "Maintenance", label: "Maintenance" },
  { key: "Inactive", label: "Inactive" },
];

export function EditEquipmentModal({
  visible,
  equipment,
  onClose,
  onSuccess,
}: EditEquipmentModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [typeId, setTypeId] = useState<number>(0);
  const [serialNumber, setSerialNumber] = useState("");
  const [efficiency, setEfficiency] = useState("100");
  const [status, setStatus] = useState("Available");
  const [maintenanceStatus, setMaintenanceStatus] = useState("");
  const [types, setTypes] = useState<EquipmentTypeItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      getEquipmentTypes()
        .then((data) => {
          setTypes(data);
          if (equipment) {
            setName(equipment.equipmentName || "");
            setCode(equipment.equipmentCode || "");
            setTypeId(equipment.typeId || (data.length > 0 ? data[0].equipmentTypeId : 0));
            setSerialNumber(equipment.serialNumber || "");
            setEfficiency(
              String(
                equipment.efficiencyScore != null
                  ? Math.round(
                      equipment.efficiencyScore > 1
                        ? equipment.efficiencyScore
                        : equipment.efficiencyScore * 100
                    )
                  : 100
              )
            );
            setStatus(equipment.status || "Available");
            setMaintenanceStatus(equipment.maintenanceStatus || "");
          } else {
            setName("");
            setCode(`EQ-${Date.now().toString().slice(-4)}`);
            setTypeId(data.length > 0 ? data[0].equipmentTypeId : 0);
            setSerialNumber("");
            setEfficiency("100");
            setStatus("Available");
            setMaintenanceStatus("Tốt");
          }
        })
        .catch((e) => console.warn("Load types error:", e));
    }
  }, [visible, equipment]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên thiết bị.");
      return;
    }
    if (!code.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã thiết bị (Equipment Code).");
      return;
    }

    const effNum = Number(efficiency);

    try {
      setSaving(true);
      const payload: EquipmentRequest = {
        equipmentName: name.trim(),
        equipmentCode: code.trim(),
        equipmentTypeId: typeId || (types.length > 0 ? types[0].equipmentTypeId : 1),
        serialNumber: serialNumber.trim() || undefined,
        efficiencyScore: isNaN(effNum) ? 1 : effNum > 1 ? effNum / 100 : effNum,
        status,
        maintenanceStatus: maintenanceStatus.trim() || undefined,
      };

      if (equipment) {
        await updateEquipment(equipment.equipmentId, payload);
        Alert.alert("Thành công", `Đã cập nhật thiết bị "${payload.equipmentName}"!`);
      } else {
        await createEquipment(payload);
        Alert.alert("Thành công", `Đã thêm mới thiết bị "${payload.equipmentName}"!`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save equipment error:", err);
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Không thể lưu thiết bị. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

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
                  <Text style={styles.modalTitle}>
                    {equipment ? "Edit Machinery / Asset" : "Add Machinery / Asset"}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {equipment ? equipment.equipmentName : "Thêm mới thiết bị chuyên dụng"}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Equipment Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Equipment Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Ví dụ: Máy đo quang hợp LCpro T"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Equipment Code */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Equipment Code <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={code}
                    onChangeText={setCode}
                    placeholder="EQ-LCPRO-01"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Type Selector */}
                {types.length > 0 && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      Equipment Type <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.typeScroll}>
                      {types.map((t) => {
                        const isSelected = typeId === t.equipmentTypeId;
                        return (
                          <TouchableOpacity
                            key={t.equipmentTypeId}
                            style={[styles.typeChip, isSelected && styles.typeChipActive]}
                            onPress={() => setTypeId(t.equipmentTypeId)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.typeChipText,
                                isSelected && styles.typeChipTextActive,
                              ]}
                            >
                              {t.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Serial Number */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Serial Number</Text>
                  <TextInput
                    style={styles.input}
                    value={serialNumber}
                    onChangeText={setSerialNumber}
                    placeholder="SN-2026-XXXX"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Efficiency Score */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Efficiency Score (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={efficiency}
                    onChangeText={setEfficiency}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Status */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Status <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.statusGrid}>
                    {STATUS_OPTIONS.map((opt) => {
                      const isActive = status.toLowerCase() === opt.key.toLowerCase();
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
                    <Text style={styles.saveBtnText}>
                      {equipment ? "Save Changes" : "Add Equipment"}
                    </Text>
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
