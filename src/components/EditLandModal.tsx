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
import { LandItem, LandRequest } from "../types/land";
import { AreaItem, getAreas } from "../api/areaApi";
import { createLand, updateLand } from "../api/landApi";
import { styles } from "./EditLandModal.styles";

interface EditLandModalProps {
  visible: boolean;
  land: LandItem | null;
  defaultAreaId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { key: "Available", label: "Available" },
  { key: "InUse", label: "InUse" },
  { key: "Maintenance", label: "Maintenance" },
  { key: "Inactive", label: "Inactive" },
];

export function EditLandModal({
  visible,
  land,
  defaultAreaId,
  onClose,
  onSuccess,
}: EditLandModalProps) {
  const [landCode, setLandCode] = useState("");
  const [areaId, setAreaId] = useState<number>(0);
  const [areaSize, setAreaSize] = useState("");
  const [soilType, setSoilType] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("Available");
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      getAreas()
        .then((data) => {
          setAreas(data);
          if (land) {
            setLandCode(land.landCode || "");
            setAreaId(land.areaId || (data.length > 0 ? data[0].areaId : 0));
            setAreaSize(String(land.areaSize || land.area || ""));
            setSoilType(land.soilType || "");
            setLocation(land.location || "");
            setStatus(land.status || "Available");
          } else {
            setLandCode(`PLOT-${Date.now().toString().slice(-4)}`);
            setAreaId(defaultAreaId || (data.length > 0 ? data[0].areaId : 0));
            setAreaSize("200");
            setSoilType("Đất rừng");
            setLocation("");
            setStatus("Available");
          }
        })
        .catch((e) => console.warn("Load areas error:", e));
    }
  }, [visible, land, defaultAreaId]);

  const handleSave = async () => {
    if (!landCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã lô đất (Land Code).");
      return;
    }
    const sizeNum = Number(areaSize);
    if (isNaN(sizeNum) || sizeNum <= 0) {
      Alert.alert("Lỗi", "Diện tích lô đất không hợp lệ.");
      return;
    }

    try {
      setSaving(true);
      const payload: LandRequest = {
        landCode: landCode.trim(),
        areaId: areaId || (areas.length > 0 ? areas[0].areaId : 1),
        areaSize: sizeNum,
        soilType: soilType.trim() || "Đất rừng",
        location: location.trim() || undefined,
        status,
      };

      if (land) {
        await updateLand(land.landId, payload);
        Alert.alert("Thành công", `Đã cập nhật lô đất "${payload.landCode}"!`);
      } else {
        await createLand(payload);
        Alert.alert("Thành công", `Đã thêm mới lô đất "${payload.landCode}"!`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save land error:", err);
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Không thể lưu thông tin lô đất. Vui lòng thử lại."
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
                    {land ? "Edit Land Resource" : "Add Land Resource"}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {land ? land.landCode : "Thêm mới lô đất vào phân khu"}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Land Code */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Land Code <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={landCode}
                    onChangeText={setLandCode}
                    placeholder="PLOT-HL-01"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Area Selector */}
                {areas.length > 0 && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      Phân khu (Area) <Text style={styles.required}>*</Text>
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.areaScroll}>
                        {areas.map((a) => {
                          const isSelected = areaId === a.areaId;
                          return (
                            <TouchableOpacity
                              key={a.areaId}
                              style={[styles.areaChip, isSelected && styles.areaChipActive]}
                              onPress={() => setAreaId(a.areaId)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.areaChipText,
                                  isSelected && styles.areaChipTextActive,
                                ]}
                              >
                                {a.areaName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Size (m2) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Size (m²) <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={areaSize}
                    onChangeText={setAreaSize}
                    keyboardType="numeric"
                    placeholder="250"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Soil Type */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Soil Type <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={soilType}
                    onChangeText={setSoilType}
                    placeholder="peat soil, Sandy Soil, Đất feralit..."
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Location */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Lô Đồi Cao Số 1 - Đỉnh Đồi Cát"
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
                      {land ? "Save Changes" : "Add Land"}
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
