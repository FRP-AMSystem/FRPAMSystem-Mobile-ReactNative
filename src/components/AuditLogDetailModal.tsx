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

function parseMetadata(metaStr?: string | null): Record<string, unknown> | null {
  if (!metaStr) return null;
  try {
    return JSON.parse(metaStr);
  } catch {
    return { raw: metaStr };
  }
}

export function resolveLogSeverity(log: AuditLogItem): {
  label: string;
  type: "success" | "info" | "warning" | "error";
  bg: string;
  text: string;
  border: string;
} {
  const meta = parseMetadata(log.metadata);
  const statusCode = Number(meta?.StatusCode ?? meta?.statusCode ?? 0);
  const desc = log.description || "";

  if (
    (statusCode >= 200 && statusCode < 300) ||
    desc.includes("Status 200") ||
    desc.includes("Status 201")
  ) {
    return { label: "SUCCESS", type: "success", bg: "#f0fdf4", text: "#15803d", border: "#86efac" };
  }
  if (
    statusCode >= 500 ||
    desc.includes("Status 500") ||
    desc.toLowerCase().includes("error")
  ) {
    return { label: "ERROR", type: "error", bg: "#fef2f2", text: "#b91c1c", border: "#fca5a5" };
  }
  if (
    statusCode >= 400 ||
    desc.includes("Status 40") ||
    desc.toLowerCase().includes("warning")
  ) {
    return { label: "WARNING", type: "warning", bg: "#fffbeb", text: "#b45309", border: "#fde68a" };
  }

  const rawSev = (log.severity || "INFO").toUpperCase();
  if (rawSev === "ERROR") {
    return { label: "ERROR", type: "error", bg: "#fef2f2", text: "#b91c1c", border: "#fca5a5" };
  }
  if (rawSev === "WARNING" || rawSev === "WARN") {
    return { label: "WARNING", type: "warning", bg: "#fffbeb", text: "#b45309", border: "#fde68a" };
  }
  return { label: "INFO", type: "info", bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" };
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  visible,
  log,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!log) return null;

  const sevInfo = resolveLogSeverity(log);
  const parsedMeta = parseMetadata(log.metadata);

  const rawTime = log.createdAt || log.timestamp;
  const formattedTimestamp = rawTime
    ? new Date(rawTime).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Unknown";

  const actorDisplay =
    log.actorFullName || log.userFullName || log.actorUsername || log.username || "System / Automated";
  const actorRole = log.actorRoleName || log.roleName;

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
              <Ionicons name="terminal-outline" size={22} color="#16a34a" />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Audit Log Record #{log.auditLogId || log.id}</Text>
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
                <Text style={styles.metaLabel}>Status / Severity</Text>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: sevInfo.bg, borderColor: sevInfo.border, borderWidth: 1 },
                  ]}
                >
                  <Text style={[styles.severityText, { color: sevInfo.text }]}>
                    {sevInfo.label}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Module</Text>
                <Text style={styles.metaValue}>{log.module || "General"}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Action</Text>
                <Text style={styles.metaValue}>{log.action || "Execute"}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Actor / User</Text>
                <Text style={styles.metaValue}>
                  {actorDisplay} {actorRole ? `(${actorRole})` : ""}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Timestamp</Text>
                <Text style={styles.metaValue}>{formattedTimestamp}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Raw BE Severity</Text>
                <Text style={[styles.metaValue, { color: "#64748b" }]}>
                  {log.severity || "WARNING"}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.detailsBox}>
              <Text style={styles.detailsText}>
                {log.description || log.details || "No description provided."}
              </Text>
            </View>

            {/* Request Payload & Metadata */}
            {parsedMeta && (
              <>
                <Text style={styles.sectionTitle}>Request Payload & Metadata</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    {JSON.stringify(parsedMeta, null, 2)}
                  </Text>
                </View>
              </>
            )}

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
