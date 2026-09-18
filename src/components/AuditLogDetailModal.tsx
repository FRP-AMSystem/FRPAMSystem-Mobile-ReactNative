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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuditLogItem } from "../types/auditLog";
import { styles } from "./AuditLogDetailModal.styles";

interface AuditLogDetailModalProps {
  visible: boolean;
  log: AuditLogItem | null;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  visible,
  log,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!log) return null;

  const getSeverityStyle = (sev?: string) => {
    switch ((sev || "").toLowerCase()) {
      case "error":
      case "critical":
        return { bg: "#fee2e2", text: "#b91c1c", label: "Lỗi nghiêm trọng" };
      case "warning":
        return { bg: "#fef3c7", text: "#d97706", label: "Cảnh báo" };
      case "info":
      default:
        return { bg: "#e0f2fe", text: "#0284c7", label: "Thông tin" };
    }
  };

  const sevInfo = getSeverityStyle(log.severity);

  const formatJson = (str?: string) => {
    if (!str) return null;
    try {
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return str;
    }
  };

  const formattedTimestamp = log.timestamp || log.createdAt
    ? new Date(log.timestamp || log.createdAt || "").toLocaleString("vi-VN")
    : "Không xác định";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
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
              <Ionicons name="shield-checkmark" size={22} color="#16a34a" />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Chi tiết Nhật ký Hệ thống</Text>
              <Text style={styles.subtitle}>{log.action || "Hoạt động ghi nhận"}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Meta Grid */}
            <View style={styles.metaGrid}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Mức độ cảnh báo</Text>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: sevInfo.bg },
                  ]}
                >
                  <Text style={[styles.severityText, { color: sevInfo.text }]}>
                    {sevInfo.label}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Phân hệ (Module)</Text>
                <Text style={styles.metaValue}>{log.module || "Hệ thống chung"}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Hành động</Text>
                <Text style={styles.metaValue}>{log.action || "Thao tác"}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Người thực hiện</Text>
                <Text style={styles.metaValue}>
                  {log.userFullName || log.username || "Hệ thống tự động"}
                </Text>
              </View>

              {log.roleName ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Vai trò</Text>
                  <Text style={styles.metaValue}>{log.roleName}</Text>
                </View>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Thời gian ghi nhận</Text>
                <Text style={styles.metaValue}>{formattedTimestamp}</Text>
              </View>

              {log.ipAddress ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Địa chỉ IP</Text>
                  <Text style={styles.metaValue}>{log.ipAddress}</Text>
                </View>
              ) : null}
            </View>

            {/* Chi tiết nội dung */}
            {log.details ? (
              <>
                <Text style={styles.sectionTitle}>Nội dung mô tả</Text>
                <View style={styles.detailsBox}>
                  <Text style={styles.detailsText}>{log.details}</Text>
                </View>
              </>
            ) : null}

            {/* Dữ liệu thay đổi mới (New Values) */}
            {log.newValues ? (
              <>
                <Text style={styles.sectionTitle}>Dữ liệu cập nhật (Payload)</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{formatJson(log.newValues)}</Text>
                </View>
              </>
            ) : null}

            {/* Dữ liệu cũ (Old Values) */}
            {log.oldValues ? (
              <>
                <Text style={styles.sectionTitle}>Dữ liệu trước đó</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{formatJson(log.oldValues)}</Text>
                </View>
              </>
            ) : null}

            <TouchableOpacity
              style={styles.closeActionBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeActionText}>Đóng</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
