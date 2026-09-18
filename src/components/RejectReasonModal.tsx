import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./RejectReasonModal.styles";

interface RejectReasonModalProps {
  visible: boolean;
  title: string;
  itemTitle?: string;
  itemType: "đề tài" | "kế hoạch phân bổ";
  loading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const QUICK_REASONS = [
  "Thiếu trang thiết bị cần thiết",
  "Xung đột lịch nhân sự",
  "Yêu cầu diện tích đất không phù hợp",
  "Chưa đủ thông tin mô tả kỹ thuật",
  "Thời gian triển khai quá gấp",
];

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  visible,
  title,
  itemTitle,
  itemType,
  loading = false,
  onClose,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState("");

  const handleSelectQuickReason = (text: string) => {
    if (!reason.trim()) {
      setReason(text);
    } else {
      setReason((prev) => `${prev}. ${text}`);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập lý do từ chối để người yêu cầu có thể điều chỉnh.");
      return;
    }
    await onConfirm(reason.trim());
    setReason("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>

        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Ionicons name="close-circle-outline" size={24} color="#dc2626" />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>
                Từ chối {itemType} và gửi phản hồi
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Target Info */}
          {itemTitle ? (
            <View style={styles.targetBox}>
              <Text style={styles.targetLabel}>Đối tượng thẩm định:</Text>
              <Text style={styles.targetTitle} numberOfLines={2}>
                {itemTitle}
              </Text>
            </View>
          ) : null}

          {/* Input */}
          <Text style={styles.label}>
            Lý do từ chối <Text style={{ color: "#dc2626" }}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập chi tiết lý do từ chối (bắt buộc)..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
          />

          {/* Quick Reasons */}
          <View style={styles.quickReasonsContainer}>
            <Text style={styles.quickLabel}>Gợi ý lý do nhanh:</Text>
            <View style={styles.quickPillsWrap}>
              {QUICK_REASONS.map((r, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickPill}
                  onPress={() => handleSelectQuickReason(r)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickPillText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (!reason.trim() || loading) && styles.confirmBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!reason.trim() || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color="#ffffff" />
                  <Text style={styles.confirmBtnText}>Xác nhận từ chối</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
