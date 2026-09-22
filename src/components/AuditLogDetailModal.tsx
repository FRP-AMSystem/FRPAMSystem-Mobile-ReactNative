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
        return { bg: "#fee2e2", text: "#b91c1c", label: "Error" };
      case "warning":
        return { bg: "#fef3c7", text: "#d97706", label: "Warning" };
      case "info":
      default:
        return { bg: "#e0f2fe", text: "#0284c7", label: "Info" };
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
    ? new Date(log.timestamp || log.createdAt || "").toLocaleString("en-US")
    : "Unknown";

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
              <Text style={styles.title}>System Audit Log Details</Text>
              <Text style={styles.subtitle}>{log.action || "Recorded Activity"}</Text>
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
                <Text style={styles.metaLabel}>Severity</Text>
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
                <Text style={styles.metaLabel}>Module</Text>
                <Text style={styles.metaValue}>{log.module || "General System"}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Action</Text>
                <Text style={styles.metaValue}>{log.action || "Operation"}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Actor</Text>
                <Text style={styles.metaValue}>
                  {log.userFullName || log.username || "Automated System"}
                </Text>
              </View>

              {log.roleName ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Role</Text>
                  <Text style={styles.metaValue}>{log.roleName}</Text>
                </View>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Timestamp</Text>
                <Text style={styles.metaValue}>{formattedTimestamp}</Text>
              </View>

              {log.ipAddress ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>IP Address</Text>
                  <Text style={styles.metaValue}>{log.ipAddress}</Text>
                </View>
              ) : null}
            </View>

            {/* Details */}
            {log.details ? (
              <>
                <Text style={styles.sectionTitle}>Description & Details</Text>
                <View style={styles.detailsBox}>
                  <Text style={styles.detailsText}>{log.details}</Text>
                </View>
              </>
            ) : null}

            {/* New Values */}
            {log.newValues ? (
              <>
                <Text style={styles.sectionTitle}>Updated Data (Payload)</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{formatJson(log.newValues)}</Text>
                </View>
              </>
            ) : null}

            {/* Old Values */}
            {log.oldValues ? (
              <>
                <Text style={styles.sectionTitle}>Previous Data (Old Values)</Text>
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
              <Text style={styles.closeActionText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
