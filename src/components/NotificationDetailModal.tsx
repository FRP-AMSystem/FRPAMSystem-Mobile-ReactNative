import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NotificationItem } from "../types/notification";
import { styles } from "./NotificationDetailModal.styles";

interface NotificationDetailModalProps {
  visible: boolean;
  notification: NotificationItem | null;
  onClose: () => void;
  onOpenSchedule?: (scheduleId: number) => void;
  onOpenExperiment?: (experimentId: number) => void;
  onOpenAllocationPlan?: (planId: number) => void;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getNotificationCategory(item: NotificationItem | null) {
  const type = item?.notificationType || "";
  const refType = item?.referenceType || "";

  if (type.includes("Schedule") || refType === "Schedule") {
    return {
      label: "Shift Schedule & Assignment",
      icon: "calendar" as const,
      color: "#2563eb",
      bg: "#eff6ff",
      refName: "Field Duty Shift",
    };
  }
  if (type.includes("Experiment") || refType === "Experiment") {
    return {
      label: "Experiment & Research Plan",
      icon: "flask" as const,
      color: "#16a34a",
      bg: "#f0fdf4",
      refName: "Research Experiment",
    };
  }
  if (type.includes("Allocation") || refType === "AllocationPlan") {
    return {
      label: "Resource Allocation",
      icon: "git-network" as const,
      color: "#9333ea",
      bg: "#faf5ff",
      refName: "Coordination Plan",
    };
  }
  if (type.includes("Equipment") || refType?.includes("Equipment")) {
    return {
      label: "Machinery & Handover",
      icon: "construct" as const,
      color: "#d97706",
      bg: "#fffbeb",
      refName: "Machinery / Equipment",
    };
  }
  return {
    label: "System Notification",
    icon: "notifications" as const,
    color: "#475569",
    bg: "#f1f5f9",
    refName: "Related Item",
  };
}

export function NotificationDetailModal({
  visible,
  notification,
  onClose,
  onOpenSchedule,
  onOpenExperiment,
  onOpenAllocationPlan,
}: NotificationDetailModalProps) {
  if (!visible || !notification) return null;

  const category = getNotificationCategory(notification);
  const isScheduleRef = notification.referenceType === "Schedule" && notification.referenceId;
  const isExperimentRef = notification.referenceType === "Experiment" && notification.referenceId;
  const isAllocationPlanRef = notification.referenceType === "AllocationPlan" && notification.referenceId;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.categoryIconBox, { backgroundColor: category.bg }]}>
              <Ionicons name={category.icon} size={20} color={category.color} />
            </View>

            <View style={styles.headerTextGroup}>
              <Text style={[styles.categoryLabel, { color: category.color }]}>
                {category.label}
              </Text>
              <Text style={styles.timeText}>{formatDate(notification.createdAt)}</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{notification.title}</Text>

            <View style={styles.messageBox}>
              <Text style={styles.message}>{notification.message}</Text>
            </View>

            {notification.referenceType ? (
              <View style={styles.refBox}>
                <Ionicons name="link-outline" size={16} color="#15803d" />
                <Text style={styles.refLabel}>Related category:</Text>
                <Text style={styles.refValue}>{category.refName}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {isScheduleRef && onOpenSchedule ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  onClose();
                  onOpenSchedule(notification.referenceId!);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="eye-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryBtnText}>View Shift Details</Text>
              </TouchableOpacity>
            ) : null}

            {isExperimentRef && onOpenExperiment ? (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: "#16a34a" }]}
                onPress={() => {
                  onClose();
                  onOpenExperiment(notification.referenceId!);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="flask-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryBtnText}>View Experiment Details</Text>
              </TouchableOpacity>
            ) : null}

            {isAllocationPlanRef && onOpenAllocationPlan ? (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: "#9333ea" }]}
                onPress={() => {
                  onClose();
                  onOpenAllocationPlan(notification.referenceId!);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="git-network-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryBtnText}>View Allocation Plan</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
