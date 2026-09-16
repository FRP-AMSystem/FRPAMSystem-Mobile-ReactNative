import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getNotifications, markAsRead, markAllAsRead } from "../../api/notificationApi";
import { getScheduleById } from "../../api/scheduleApi";
import { NotificationItem } from "../../types/notification";
import { ScheduleItem } from "../../types/schedule";
import { Colors } from "../../constants/colors";
import { ScheduleDetailModal } from "../../components/ScheduleDetailModal";
import { NotificationDetailModal } from "../../components/NotificationDetailModal";
import { styles } from "../../styles/notifications.styles";

function getNotificationVisuals(item: NotificationItem) {
  const type = item.notificationType || "";
  const refType = item.referenceType || "";

  if (type.includes("Schedule") || refType === "Schedule") {
    return {
      categoryLabel: "Lịch Ca trực",
      icon: "calendar" as const,
      iconColor: "#2563eb",
      iconBg: "#eff6ff",
      badgeColor: "#1d4ed8",
      badgeBg: "#dbeafe",
      badgeBorder: "#bfdbfe",
    };
  }
  if (type.includes("Experiment") || refType === "Experiment") {
    return {
      categoryLabel: "Đề tài Thử nghiệm",
      icon: "flask" as const,
      iconColor: "#16a34a",
      iconBg: "#f0fdf4",
      badgeColor: "#15803d",
      badgeBg: "#dcfce7",
      badgeBorder: "#bbf7d0",
    };
  }
  if (type.includes("Allocation") || refType === "AllocationPlan") {
    return {
      categoryLabel: "Phân bổ Tài nguyên",
      icon: "git-network" as const,
      iconColor: "#9333ea",
      iconBg: "#faf5ff",
      badgeColor: "#7e22ce",
      badgeBg: "#f3e8ff",
      badgeBorder: "#e9d5ff",
    };
  }
  if (type.includes("Equipment") || refType.includes("Equipment")) {
    return {
      categoryLabel: "Bàn giao Thiết bị",
      icon: "construct" as const,
      iconColor: "#d97706",
      iconBg: "#fffbeb",
      badgeColor: "#b45309",
      badgeBg: "#fef3c7",
      badgeBorder: "#fde68a",
    };
  }
  return {
    categoryLabel: "Thông báo Hệ thống",
    icon: "notifications" as const,
    iconColor: "#475569",
    iconBg: "#f1f5f9",
    badgeColor: "#475569",
    badgeBg: "#f1f5f9",
    badgeBorder: "#e2e8f0",
  };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Selected schedule modal state
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Selected general notification modal state
  const [generalModalVisible, setGeneralModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể tải danh sách thông báo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể đánh dấu tất cả thông báo.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleOpenScheduleDetail = async (scheduleId: number) => {
    try {
      setSelectedSchedule(null);
      setScheduleLoading(true);
      setScheduleModalVisible(true);

      const sched = await getScheduleById(scheduleId);
      setSelectedSchedule(sched);
    } catch (err: any) {
      console.error("Fetch schedule error:", err);
      Alert.alert("Lỗi", "Không thể tải chi tiết ca trực này.");
      setScheduleModalVisible(false);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handlePressItem = async (item: NotificationItem) => {
    // 1. Mark as read if unread
    if (!item.isRead) {
      try {
        await markAsRead(item.notificationId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === item.notificationId ? { ...n, isRead: true } : n
          )
        );
      } catch (err) {
        console.error("Mark as read error:", err);
      }
    }

    // 2. Open detail view
    if (item.referenceType === "Schedule" && item.referenceId) {
      await handleOpenScheduleDetail(item.referenceId);
    } else {
      setSelectedNotification(item);
      setGeneralModalVisible(true);
    }
  };

  const handleNavigateToCalendar = (sched: ScheduleItem) => {
    router.push("/(tabs)/schedules");
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.title}>Thông báo hệ thống</Text>
          <Text style={styles.subtitle}>Cập nhật điều phối ca trực và bàn giao thiết bị</Text>
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllRead}
            disabled={markingAll}
            activeOpacity={0.7}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={15} color={Colors.primary} />
                <Text style={styles.markAllText}>Đã đọc hết</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="notifications-off-outline" size={36} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
          <Text style={styles.emptyText}>Các cập nhật ca trực và nhiệm vụ sẽ xuất hiện tại đây.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.notificationId)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const visuals = getNotificationVisuals(item);
            const isSchedule = item.referenceType === "Schedule" && item.referenceId;

            return (
              <TouchableOpacity
                style={[styles.card, !item.isRead && styles.cardUnread]}
                onPress={() => handlePressItem(item)}
                activeOpacity={0.75}
              >
                {/* Visual Category Icon */}
                <View style={[styles.iconCol, { backgroundColor: visuals.iconBg }]}>
                  <Ionicons name={visuals.icon} size={20} color={visuals.iconColor} />
                </View>

                {/* Content */}
                <View style={styles.contentCol}>
                  {/* Category Pill & Unread indicator */}
                  <View style={styles.topRow}>
                    <View
                      style={[
                        styles.categoryPill,
                        { backgroundColor: visuals.badgeBg, borderColor: visuals.badgeBorder },
                      ]}
                    >
                      <Text style={[styles.categoryPillText, { color: visuals.badgeColor }]}>
                        {visuals.categoryLabel}
                      </Text>
                    </View>

                    <View style={styles.topRightRow}>
                      <Text style={styles.timeText}>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </Text>
                      {!item.isRead ? <View style={styles.dot} /> : null}
                    </View>
                  </View>

                  {/* Title */}
                  <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleUnread]}>
                    {item.title}
                  </Text>

                  {/* Message */}
                  <Text style={styles.messageText} numberOfLines={2}>
                    {item.message}
                  </Text>

                  {/* Direct Action Hint */}
                  {isSchedule ? (
                    <View style={styles.actionHintRow}>
                      <Ionicons name="arrow-forward-circle-outline" size={14} color={Colors.primary} />
                      <Text style={styles.actionHintText}>Bấm để xem chi tiết ca trực</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* 1. Rich Domain Schedule Detail Modal */}
      <ScheduleDetailModal
        visible={scheduleModalVisible}
        schedule={selectedSchedule}
        loading={scheduleLoading}
        onClose={() => setScheduleModalVisible(false)}
        onNavigateToCalendar={handleNavigateToCalendar}
      />

      {/* 2. General Notification Detail Modal */}
      <NotificationDetailModal
        visible={generalModalVisible}
        notification={selectedNotification}
        onClose={() => setGeneralModalVisible(false)}
        onOpenSchedule={handleOpenScheduleDetail}
      />
    </SafeAreaView>
  );
}
