import { SafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getMySchedules, getAllSchedules } from "../../api/scheduleApi";
import { ScheduleItem, ScheduleStatus } from "../../types/schedule";
import { Colors } from "../../constants/colors";
import { ScheduleDetailModal } from "../../components/ScheduleDetailModal";
import { styles } from "../../styles/schedules.styles";

const WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  key: string;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  let startDow = firstOfMonth.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: CalendarDay[] = [];

  // Days from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({
      date: d,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      key: dateKey(d),
    });
  }

  // Days of current month
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({
      date,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      key: dateKey(date),
    });
  }

  // Fill remainder to complete weeks
  const remainder = days.length % 7;
  if (remainder > 0) {
    const fill = 7 - remainder;
    for (let i = 1; i <= fill; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: isSameDay(d, today),
        key: dateKey(d),
      });
    }
  }

  return days;
}

// Compact event text preview (e.g. "Bay quét...")
function getEventCompactText(schedule: ScheduleItem): string {
  return schedule.title || schedule.experimentName || "Ca trực nhiệm vụ";
}

// Get the dominant status for coloring day background & border
function getDominantStatus(events: ScheduleItem[]): ScheduleStatus | null {
  if (!events || events.length === 0) return null;
  if (events.some((e) => e.status === "InProgress")) return "InProgress";
  if (events.some((e) => e.status === "Planned")) return "Planned";
  if (events.some((e) => e.status === "Completed")) return "Completed";
  return "Cancelled";
}

// Status color configuration for cell background, border, and badge
function getStatusTheme(status: ScheduleStatus | null) {
  switch (status) {
    case "InProgress":
      return {
        bg: "#fffbeb",
        border: "#fcd34d",
        badgeBg: "#fef3c7",
        badgeBorder: "#fde68a",
        badgeText: "#b45309",
      };
    case "Planned":
      return {
        bg: "#eff6ff",
        border: "#93c5fd",
        badgeBg: "#dbeafe",
        badgeBorder: "#bfdbfe",
        badgeText: "#1d4ed8",
      };
    case "Completed":
      return {
        bg: "#f0fdf4",
        border: "#86efac",
        badgeBg: "#dcfce7",
        badgeBorder: "#bbf7d0",
        badgeText: "#15803d",
      };
    case "Cancelled":
      return {
        bg: "#fef2f2",
        border: "#fca5a5",
        badgeBg: "#fee2e2",
        badgeBorder: "#fecaca",
        badgeText: "#b91c1c",
      };
    default:
      return null;
  }
}

export default function SchedulesScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(now);

  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"" | ScheduleStatus>("");
  const [selectedDetailSchedule, setSelectedDetailSchedule] = useState<ScheduleItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = scope === "mine" ? await getMySchedules() : await getAllSchedules();
      setSchedules(data || []);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể tải danh sách lịch công tác.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scope]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Month navigation
  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(today);
  };

  // Jump to specific month
  const jumpToMonth = (targetYear: number, targetMonth: number) => {
    setYear(targetYear);
    setMonth(targetMonth);
    setSelectedDate(new Date(targetYear, targetMonth, 1));
  };

  // Build calendar matrix
  const calendarDays = useMemo(() => buildCalendarDays(year, month), [year, month]);

  // Filter schedules by status
  const filteredSchedules = useMemo(() => {
    if (!statusFilter) return schedules;
    return schedules.filter((s) => s.status === statusFilter);
  }, [schedules, statusFilter]);

  // Map schedules by date string
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();

    for (const schedule of filteredSchedules) {
      if (!schedule.startDate) continue;
      const start = new Date(schedule.startDate);
      const end = schedule.endDate ? new Date(schedule.endDate) : start;

      if (Number.isNaN(start.getTime())) continue;

      const current = new Date(start);
      const endDay = Number.isNaN(end.getTime()) ? start : end;

      let safetyCount = 0;
      while (current <= endDay && safetyCount < 365) {
        const k = dateKey(current);
        if (!map.has(k)) {
          map.set(k, []);
        }
        map.get(k)!.push(schedule);
        current.setDate(current.getDate() + 1);
        safetyCount++;
      }
    }

    return map;
  }, [filteredSchedules]);

  // Selected day events
  const selectedDayKey = dateKey(selectedDate);
  const selectedDayEvents = eventsByDate.get(selectedDayKey) || [];

  // Check if current month has any events
  const currentMonthHasEvents = useMemo(() => {
    return calendarDays.some((day) => day.isCurrentMonth && eventsByDate.has(day.key));
  }, [calendarDays, eventsByDate]);

  // Find other months with events to provide a helpful quick-jump
  const nearestMonthWithEvents = useMemo(() => {
    if (schedules.length === 0) return null;
    for (const s of schedules) {
      if (!s.startDate) continue;
      const d = new Date(s.startDate);
      if (!Number.isNaN(d.getTime())) {
        const sYear = d.getFullYear();
        const sMonth = d.getMonth();
        if (sYear !== year || sMonth !== month) {
          return { year: sYear, month: sMonth };
        }
      }
    }
    return null;
  }, [schedules, year, month]);

  const statusOptions: { value: "" | ScheduleStatus; label: string }[] = [
    { value: "", label: "Tất cả" },
    { value: "Planned", label: "Đã lên lịch" },
    { value: "InProgress", label: "Đang làm" },
    { value: "Completed", label: "Hoàn tất" },
    { value: "Cancelled", label: "Đã hủy" },
  ];

  const getStatusBadgeConfig = (status?: string) => {
    switch (status) {
      case "InProgress":
        return { bg: "#fef3c7", text: "#b45309", border: "#fde68a", label: "Đang thực hiện" };
      case "Completed":
        return { bg: "#dcfce7", text: "#15803d", border: "#86efac", label: "Đã hoàn thành" };
      case "Cancelled":
        return { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5", label: "Đã hủy" };
      case "Planned":
      default:
        return { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe", label: "Đã lên kế hoạch" };
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* 0. Scope Switcher */}
        <View style={styles.scopeContainer}>
          <TouchableOpacity
            style={[styles.scopeBtn, scope === "mine" ? styles.scopeBtnActive : null]}
            onPress={() => setScope("mine")}
          >
            <Ionicons
              name="person"
              size={14}
              color={scope === "mine" ? "#ffffff" : Colors.textSecondary}
              style={styles.scopeIcon}
            />
            <Text style={[styles.scopeBtnText, scope === "mine" ? styles.scopeBtnTextActive : null]}>
              Ca trực của tôi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeBtn, scope === "all" ? styles.scopeBtnActive : null]}
            onPress={() => setScope("all")}
          >
            <Ionicons
              name="grid"
              size={14}
              color={scope === "all" ? "#ffffff" : Colors.textSecondary}
              style={styles.scopeIcon}
            />
            <Text style={[styles.scopeBtnText, scope === "all" ? styles.scopeBtnTextActive : null]}>
              Toàn bộ ca trực
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. Header Toolbar */}
        <View style={styles.toolbarCard}>
          <View style={styles.navRow}>
            <View style={styles.monthNav}>
              <TouchableOpacity style={styles.arrowBtn} onPress={goToPrevMonth}>
                <Ionicons name="chevron-back" size={18} color="#334155" />
              </TouchableOpacity>

              <Text style={styles.monthLabel}>
                {MONTH_NAMES[month]} {year}
              </Text>

              <TouchableOpacity style={styles.arrowBtn} onPress={goToNextMonth}>
                <Ionicons name="chevron-forward" size={18} color="#334155" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.todayBtn} onPress={goToToday}>
                <Text style={styles.todayBtnText}>Hôm nay</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
              <Text style={styles.legendText}>Đã lên lịch</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
              <Text style={styles.legendText}>Đang làm</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
              <Text style={styles.legendText}>Hoàn tất</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
              <Text style={styles.legendText}>Đã hủy</Text>
            </View>
          </View>
        </View>

        {/* Quick Jump Banner */}
        {!loading && !currentMonthHasEvents && nearestMonthWithEvents ? (
          <TouchableOpacity
            style={styles.quickJumpBanner}
            onPress={() => jumpToMonth(nearestMonthWithEvents.year, nearestMonthWithEvents.month)}
            activeOpacity={0.8}
          >
            <Ionicons name="information-circle" size={18} color="#0284c7" />
            <View style={styles.quickJumpContent}>
              <Text style={styles.quickJumpText}>
                {MONTH_NAMES[month]} {year} không có ca trực.
              </Text>
              <Text style={styles.quickJumpLink}>
                👉 Bấm để xem {MONTH_NAMES[nearestMonthWithEvents.month]} {nearestMonthWithEvents.year}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* 2. Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
          {statusOptions.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.statusChip, isActive ? styles.statusChipActive : null]}
                onPress={() => setStatusFilter(opt.value)}
              >
                <Text style={[styles.statusChipText, isActive ? styles.statusChipTextActive : null]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 3. Calendar Grid Card */}
        <View style={styles.calendarCard}>
          {/* Weekday Header */}
          <View style={styles.weekdayHeader}>
            {WEEKDAY_LABELS.map((day) => (
              <View key={day} style={styles.weekdayCol}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Grid Days */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Đang tải lịch công tác...</Text>
            </View>
          ) : (
            <View style={styles.daysGrid}>
              {calendarDays.map((day) => {
                const dayEvents = eventsByDate.get(day.key) || [];
                const isSelected = isSameDay(day.date, selectedDate);
                const hasEvents = dayEvents.length > 0;
                const dominantStatus = getDominantStatus(dayEvents);
                const theme = getStatusTheme(dominantStatus);

                let cellBg = !day.isCurrentMonth ? "#fafbfc" : "#ffffff";
                let cellBorderColor = "#f1f5f9";
                let cellBorderWidth = 1;

                if (day.isCurrentMonth && theme) {
                  cellBg = theme.bg;
                  cellBorderColor = theme.border;
                } else if (day.isToday) {
                  cellBg = "#f0fdf4";
                  cellBorderColor = "#bbf7d0";
                }

                if (isSelected) {
                  cellBorderColor = Colors.primary;
                  cellBorderWidth = 2;
                }

                return (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: cellBg,
                        borderColor: cellBorderColor,
                        borderWidth: cellBorderWidth,
                      },
                    ]}
                    onPress={() => setSelectedDate(day.date)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dayTopRow}>
                      {day.isToday ? (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>{day.dayNumber}</Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.dayNumberText,
                            !day.isCurrentMonth ? styles.outsideDayNumberText : null,
                            isSelected ? styles.selectedDayNumberText : null,
                          ]}
                        >
                          {day.dayNumber}
                        </Text>
                      )}
                    </View>

                    {hasEvents && day.isCurrentMonth ? (
                      <View style={styles.eventSnippetsContainer}>
                        {dayEvents.slice(0, 2).map((ev, idx) => {
                          const evTheme = getStatusTheme(ev.status);
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.eventSnippetPill,
                                evTheme ? { backgroundColor: evTheme.badgeBg, borderColor: evTheme.badgeBorder } : null,
                              ]}
                            >
                              <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={[
                                  styles.eventSnippetText,
                                  evTheme ? { color: evTheme.badgeText } : null,
                                ]}
                              >
                                {getEventCompactText(ev)}
                              </Text>
                            </View>
                          );
                        })}
                        {dayEvents.length > 2 ? (
                          <Text style={styles.moreEventsText}>+{dayEvents.length - 2}</Text>
                        ) : null}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 4. Selected Day Task Details List */}
        <View style={styles.selectedDaySection}>
          <View style={styles.selectedDayHeader}>
            <View style={styles.selectedDateBadge}>
              <Ionicons name="calendar" size={16} color={Colors.primary} />
              <Text style={styles.selectedDateTitle}>
                {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
            </View>
            <View style={styles.taskCountBadge}>
              <Text style={styles.taskCountText}>{selectedDayEvents.length} ca trực</Text>
            </View>
          </View>

          {selectedDayEvents.length === 0 ? (
            <View style={styles.emptyDayBox}>
              <Ionicons name="leaf-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.emptyDayText}>Không có lịch công tác nào trong ngày này.</Text>
            </View>
          ) : (
            <View style={styles.dayEventList}>
              {selectedDayEvents.map((schedule) => {
                const badge = getStatusBadgeConfig(schedule.status);
                return (
                  <TouchableOpacity
                    key={schedule.scheduleId}
                    style={styles.eventCard}
                    onPress={() => {
                      setSelectedDetailSchedule(schedule);
                      setDetailModalVisible(true);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.eventCardHeader}>
                      <Text style={styles.eventCardTitle}>
                        {schedule.title || "Ca trực nhiệm vụ"}
                      </Text>
                      <View style={[styles.badgePill, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <Text style={[styles.badgePillText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>

                    {schedule.experimentName ? (
                      <View style={styles.eventInfoRow}>
                        <Ionicons name="flask-outline" size={14} color={Colors.textSecondary} style={styles.infoIcon} />
                        <Text style={styles.eventInfoText}>{schedule.experimentName}</Text>
                      </View>
                    ) : null}

                    {schedule.phaseName ? (
                      <View style={styles.eventInfoRow}>
                        <Ionicons name="layers-outline" size={14} color={Colors.textSecondary} style={styles.infoIcon} />
                        <Text style={styles.eventInfoText}>{schedule.phaseName}</Text>
                      </View>
                    ) : null}

                    <View style={styles.eventInfoRow}>
                      <Ionicons name="time-outline" size={14} color={Colors.textSecondary} style={styles.infoIcon} />
                      <Text style={styles.eventInfoText}>
                        {schedule.startDate ? schedule.startDate.split("T")[0] : "-"} đến{" "}
                        {schedule.endDate ? schedule.endDate.split("T")[0] : "-"}
                      </Text>
                    </View>

                    {schedule.assignedHumanResourceName ? (
                      <View style={styles.eventInfoRow}>
                        <Ionicons name="person-outline" size={14} color={Colors.textSecondary} style={styles.infoIcon} />
                        <Text style={styles.eventInfoText}>Phụ trách: {schedule.assignedHumanResourceName}</Text>
                      </View>
                    ) : null}

                    {schedule.description ? (
                      <View style={styles.descContainer}>
                        <Text style={styles.eventDesc}>{schedule.description}</Text>
                      </View>
                    ) : null}

                    <View style={styles.viewDetailRow}>
                      <Text style={styles.viewDetailText}>Xem chi tiết ca trực</Text>
                      <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Schedule Detail Modal */}
      <ScheduleDetailModal
        visible={detailModalVisible}
        schedule={selectedDetailSchedule}
        onClose={() => setDetailModalVisible(false)}
      />
    </SafeAreaView>
  );
}
