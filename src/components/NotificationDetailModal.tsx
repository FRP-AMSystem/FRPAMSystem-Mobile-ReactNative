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
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("vi-VN", {
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
  if (type.includes("Schedule") || item?.referenceType === "Schedule") {
    return {
      label: "Lịch Ca trực & Phân công",
      icon: "calendar" as const,
      color: "#2563eb",
      bg: "#eff6ff",
      refName: "Ca trực hiện trường",
    };
  }
  if (type.includes("Experiment") || item?.referenceType === "Experiment") {
    return {
      label: "Đề tài & Kế hoạch Thử nghiệm",
      icon: "flask" as const,
      color: "#16a34a",
      bg: "#f0fdf4",
      refName: "Đề tài nghiên cứu",
    };
  }
  if (type.includes("Allocation") || item?.referenceType === "AllocationPlan") {
    return {
      label: "Phân bổ Tài nguyên",
      icon: "git-network" as const,
      color: "#9333ea",
      bg: "#faf5ff",
      refName: "Kế hoạch điều phối",
    };
  }
  if (type.includes("Equipment") || item?.referenceType?.includes("Equipment")) {
    return {
      label: "Thiết bị & Bàn giao",
      icon: "construct" as const,
      color: "#d97706",
      bg: "#fffbeb",
      refName: "Tài sản thiết bị",
    };
  }
  return {
    label: "Thông báo Hệ thống",
    icon: "notifications" as const,
    color: "#475569",
    bg: "#f1f5f9",
    refName: "Hạng mục liên quan",
  };
}

export function NotificationDetailModal({
  visible,
  notification,
  onClose,
  onOpenSchedule,
}: NotificationDetailModalProps) {
  if (!visible || !notification) return null;

  const category = getNotificationCategory(notification);
  const isScheduleRef = notification.referenceType === "Schedule" && notification.referenceId;

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
                <Text style={styles.refLabel}>Hạng mục liên quan:</Text>
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
                <Text style={styles.primaryBtnText}>Xem Chi tiết Ca trực</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
