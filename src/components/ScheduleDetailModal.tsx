import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScheduleItem, ScheduleStatus } from "../types/schedule";
import { Colors } from "../constants/colors";
import { styles } from "./ScheduleDetailModal.styles";

interface ScheduleDetailModalProps {
  visible: boolean;
  schedule: ScheduleItem | null;
  loading?: boolean;
  onClose: () => void;
  onNavigateToCalendar?: (schedule: ScheduleItem) => void;
}

function formatDate(dateStr?: string | null): { date: string; time: string; full: string } {
  if (!dateStr) return { date: "-", time: "--:--", full: "-" };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { date: dateStr, time: "--:--", full: dateStr };

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes}`,
    full: `${hours}:${minutes} ${day}/${month}/${year}`,
  };
}

function calculateDurationDays(startStr?: string, endStr?: string): number {
  if (!startStr) return 1;
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : start;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? 1 : diffDays;
}

function getInitials(name?: string | null): string {
  if (!name) return "NV";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ScheduleDetailModal({
  visible,
  schedule,
  loading = false,
  onClose,
  onNavigateToCalendar,
}: ScheduleDetailModalProps) {
  if (!visible) return null;

  const getStatusBadge = (status?: ScheduleStatus) => {
    switch (status) {
      case "InProgress":
        return {
          label: "Đang thực hiện",
          bg: "#fffbeb",
          text: "#b45309",
          border: "#fde68a",
          icon: "flash" as const,
        };
      case "Completed":
        return {
          label: "Đã hoàn thành",
          bg: "#f0fdf4",
          text: "#15803d",
          border: "#86efac",
          icon: "checkmark-circle" as const,
        };
      case "Cancelled":
        return {
          label: "Đã hủy bỏ",
          bg: "#fef2f2",
          text: "#b91c1c",
          border: "#fca5a5",
          icon: "close-circle" as const,
        };
      case "Planned":
      default:
        return {
          label: "Đã lên kế hoạch",
          bg: "#eff6ff",
          text: "#1d4ed8",
          border: "#bfdbfe",
          icon: "calendar" as const,
        };
    }
  };

  const getPriorityBadge = (priority?: number) => {
    switch (priority) {
      case 3:
        return { label: "Khẩn cấp", bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" };
      case 2:
        return { label: "Ưu tiên Cao", bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" };
      case 1:
        return { label: "Trung bình", bg: "#fef3c7", text: "#92400e", border: "#fde68a" };
      default:
        return { label: "Bình thường", bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
    }
  };

  const statusBadge = getStatusBadge(schedule?.status);
  const priorityBadge = getPriorityBadge(schedule?.priority);
  const startInfo = formatDate(schedule?.startDate);
  const endInfo = formatDate(schedule?.endDate);
  const createdInfo = formatDate(schedule?.createdAt);
  const updatedInfo = schedule?.updatedAt ? formatDate(schedule?.updatedAt) : null;
  const duration = calculateDurationDays(schedule?.startDate, schedule?.endDate);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.categoryPill}>
                  <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
                  <Text style={styles.categoryPillText}>NHIỆM VỤ HIỆN TRƯỜNG</Text>
                </View>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  Chi tiết Ca trực
                </Text>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body Content */}
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Đang tải chi tiết ca trực...</Text>
            </View>
          ) : !schedule ? (
            <View style={styles.centerLoading}>
              <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Không tìm thấy thông tin ca trực này.</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Hero Mission Banner */}
              <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: priorityBadge.bg, borderColor: priorityBadge.border },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: priorityBadge.text }]}>
                        {priorityBadge.label}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
                      ]}
                    >
                      <Ionicons
                        name={statusBadge.icon}
                        size={12}
                        color={statusBadge.text}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.badgeText, { color: statusBadge.text }]}>
                        {statusBadge.label}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.missionTitle}>
                  {schedule.title || "Nhiệm vụ Hiện trường"}
                </Text>
              </View>

              {/* 2. Dự án & Kế hoạch Phân bổ (Experiment & Allocation) */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBox, { backgroundColor: "#f0fdf4" }]}>
                    <Ionicons name="flask" size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>Đề tài Thử nghiệm & Phân bổ</Text>
                </View>

                <View style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>Đề tài Thử nghiệm</Text>
                  <Text style={styles.fieldValueBold}>
                    {schedule.experimentName || "Đề tài Thử nghiệm Lâm nghiệp"}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>Giai đoạn Thực hiện (Phase)</Text>
                  <Text style={styles.fieldValue}>
                    {schedule.phaseName || "Giai đoạn Hiện trường"}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.fieldItem}>
                  <Text style={styles.fieldLabel}>Kế hoạch Phân bổ Tài nguyên</Text>
                  <View style={styles.allocationRow}>
                    <Ionicons name="git-network-outline" size={15} color={Colors.textSecondary} />
                    <Text style={styles.allocationText}>
                      {schedule.allocationPlanName || "Kế hoạch Phân bổ Tài nguyên Đã phê duyệt"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 3. Khung thời gian & Tiến độ (Timeline) */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBox, { backgroundColor: "#eff6ff" }]}>
                    <Ionicons name="time" size={16} color="#2563eb" />
                  </View>
                  <View style={styles.timelineHeaderRight}>
                    <Text style={styles.sectionTitle}>Khung thời gian Thực hiện</Text>
                    <View style={styles.durationPill}>
                      <Text style={styles.durationText}>{duration} ngày</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.timelineDualGrid}>
                  {/* Start Box */}
                  <View style={styles.timeBox}>
                    <View style={styles.timeBoxHeader}>
                      <Ionicons name="play-circle-outline" size={14} color="#16a34a" />
                      <Text style={styles.timeBoxHeaderLabel}>BẮT ĐẦU</Text>
                    </View>
                    <Text style={styles.timeDateText}>{startInfo.date}</Text>
                    <Text style={styles.timeHourText}>{startInfo.time}</Text>
                  </View>

                  {/* Arrow Indicator */}
                  <View style={styles.timeArrowBox}>
                    <Ionicons name="arrow-forward" size={18} color="#94a3b8" />
                  </View>

                  {/* End Box */}
                  <View style={styles.timeBox}>
                    <View style={styles.timeBoxHeader}>
                      <Ionicons name="flag-outline" size={14} color="#dc2626" />
                      <Text style={styles.timeBoxHeaderLabel}>KẾT THÚC</Text>
                    </View>
                    <Text style={styles.timeDateText}>{endInfo.date}</Text>
                    <Text style={styles.timeHourText}>{endInfo.time}</Text>
                  </View>
                </View>
              </View>

              {/* 4. Phân công & Nhân sự (Personnel) */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBox, { backgroundColor: "#faf5ff" }]}>
                    <Ionicons name="people" size={16} color="#9333ea" />
                  </View>
                  <Text style={styles.sectionTitle}>Nhân sự & Điều phối</Text>
                </View>

                {/* Assigned Personnel */}
                <View style={styles.personRow}>
                  <View style={[styles.avatarBox, { backgroundColor: "#16a34a" }]}>
                    <Text style={styles.avatarText}>
                      {getInitials(schedule.assignedHumanResourceName || schedule.assignedToUserName)}
                    </Text>
                  </View>
                  <View style={styles.personInfo}>
                    <Text style={styles.personRoleLabel}>NHÂN SỰ PHỤ TRÁCH</Text>
                    <Text style={styles.personName}>
                      {schedule.assignedHumanResourceName || schedule.assignedToUserName || "Chưa gán"}
                    </Text>
                    <Text style={styles.personSub}>
                      Kỹ thuật viên hiện trường (Phụ trách thi công)
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Creator / Dispatcher */}
                <View style={styles.personRow}>
                  <View style={[styles.avatarBox, { backgroundColor: "#0284c7" }]}>
                    <Text style={styles.avatarText}>
                      {getInitials(schedule.createdByName)}
                    </Text>
                  </View>
                  <View style={styles.personInfo}>
                    <Text style={styles.personRoleLabel}>NGƯỜI GIAO VIỆC / ĐIỀU PHỐI</Text>
                    <Text style={styles.personName}>
                      {schedule.createdByName || "Quản lý hệ thống"}
                    </Text>
                    <Text style={styles.personSub}>
                      Quản lý điều phối dự án
                    </Text>
                  </View>
                </View>
              </View>

              {/* 5. Nội dung & Yêu cầu nhiệm vụ (Task Scope / Description) */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBox, { backgroundColor: "#f8fafc" }]}>
                    <Ionicons name="document-text" size={16} color="#334155" />
                  </View>
                  <Text style={styles.sectionTitle}>Mô tả Nội dung Công việc</Text>
                </View>

                <View style={styles.descBox}>
                  <Text style={styles.descContent}>
                    {schedule.description || "Chưa có mô tả chi tiết cho nhiệm vụ này."}
                  </Text>
                </View>
              </View>

              {/* 6. Chỉ dẫn & Ghi chú kỹ thuật (Operational Instructions / Notes) */}
              <View style={[styles.sectionCard, styles.notesCard]}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBox, { backgroundColor: "#fef3c7" }]}>
                    <Ionicons name="bulb" size={16} color="#d97706" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: "#92400e" }]}>
                    Chỉ dẫn Kỹ thuật & Lưu ý Thực thi
                  </Text>
                </View>

                <View style={styles.notesBox}>
                  <Text style={styles.notesContent}>
                    {schedule.notes || "Không có chỉ dẫn đặc biệt."}
                  </Text>
                </View>
              </View>

              {/* 7. Thông tin Nhật ký Hệ thống (Audit / Record Info) */}
              <View style={styles.auditCard}>
                <View style={styles.auditRow}>
                  <Ionicons name="calendar-outline" size={13} color="#94a3b8" />
                  <Text style={styles.auditLabel}>Thời gian tạo:</Text>
                  <Text style={styles.auditValue}>{createdInfo.full}</Text>
                </View>
                {updatedInfo ? (
                  <View style={[styles.auditRow, { marginTop: 4 }]}>
                    <Ionicons name="sync-outline" size={13} color="#94a3b8" />
                    <Text style={styles.auditLabel}>Cập nhật lần cuối:</Text>
                    <Text style={styles.auditValue}>{updatedInfo.full}</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          )}

          {/* Action Footer */}
          <View style={styles.footerBar}>
            {onNavigateToCalendar && schedule ? (
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => {
                  onClose();
                  onNavigateToCalendar(schedule);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionText}>Xem trên Lịch công tác</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.secondaryActionBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.secondaryActionText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
