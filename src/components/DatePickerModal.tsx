import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./DatePickerModal.styles";

interface DatePickerModalProps {
  visible: boolean;
  value?: string; // YYYY-MM-DD
  title?: string;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  onClose: () => void;
  onSelect: (dateStr: string) => void;
}

const MONTH_NAMES = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function formatToYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePickerModal({
  visible,
  value,
  title = "Chọn ngày",
  minDate,
  maxDate,
  onClose,
  onSelect,
}: DatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    value || formatToYMD(new Date())
  );
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth()); // 0-11

  useEffect(() => {
    if (visible) {
      const initial = value || formatToYMD(new Date());
      setSelectedDate(initial);
      const parsed = new Date(initial);
      if (!isNaN(parsed.getTime())) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    }
  }, [visible, value]);

  const todayStr = useMemo(() => formatToYMD(new Date()), []);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Generate day matrix
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun, 1 is Mon...
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0 is Mon, 6 is Sun
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: { dayNumber: number; dateStr: string; disabled: boolean }[] = [];

    // Empty lead spaces
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ dayNumber: 0, dateStr: "", disabled: true });
    }

    // Days in current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const mStr = String(viewMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const dateStr = `${viewYear}-${mStr}-${dStr}`;

      let disabled = false;
      if (minDate && dateStr < minDate) disabled = true;
      if (maxDate && dateStr > maxDate) disabled = true;

      days.push({ dayNumber: d, dateStr, disabled });
    }

    return days;
  }, [viewYear, viewMonth, minDate, maxDate]);

  const handleApplyPreset = (daysToAdd: number) => {
    const base = new Date();
    base.setDate(base.getDate() + daysToAdd);
    const dateStr = formatToYMD(base);
    if ((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate)) return;

    setSelectedDate(dateStr);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onSelect(selectedDate);
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={styles.titleText}>{title}</Text>
                <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Month Navigation */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevMonth}>
                  <Ionicons name="chevron-back" size={16} color="#334155" />
                </TouchableOpacity>

                <Text style={styles.monthYearText}>
                  {MONTH_NAMES[viewMonth]}, {viewYear}
                </Text>

                <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextMonth}>
                  <Ionicons name="chevron-forward" size={16} color="#334155" />
                </TouchableOpacity>
              </View>

              {/* Weekday Headers */}
              <View style={styles.weekDaysRow}>
                {WEEK_DAYS.map((w, idx) => (
                  <Text key={idx} style={styles.weekDayText}>
                    {w}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {calendarDays.map((item, idx) => {
                  if (item.dayNumber === 0) {
                    return <View key={`empty-${idx}`} style={styles.dayCell} />;
                  }

                  const isSelected = item.dateStr === selectedDate;
                  const isToday = item.dateStr === todayStr;

                  return (
                    <TouchableOpacity
                      key={`day-${item.dateStr}`}
                      disabled={item.disabled}
                      style={[
                        styles.dayCell,
                        isToday && styles.dayCellToday,
                        isSelected && styles.dayCellSelected,
                        item.disabled && styles.dayCellDisabled,
                      ]}
                      onPress={() => setSelectedDate(item.dateStr)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isToday && styles.dayTextToday,
                          isSelected && styles.dayTextSelected,
                          item.disabled && styles.dayTextDisabled,
                        ]}
                      >
                        {item.dayNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Presets */}
              <View style={styles.quickPresetsRow}>
                <TouchableOpacity
                  style={styles.presetPill}
                  onPress={() => handleApplyPreset(0)}
                >
                  <Text style={styles.presetText}>Hôm nay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetPill}
                  onPress={() => handleApplyPreset(7)}
                >
                  <Text style={styles.presetText}>+7 ngày</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetPill}
                  onPress={() => handleApplyPreset(30)}
                >
                  <Text style={styles.presetText}>+1 tháng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetPill}
                  onPress={() => handleApplyPreset(90)}
                >
                  <Text style={styles.presetText}>+3 tháng</Text>
                </TouchableOpacity>
              </View>

              {/* Actions */}
              <View style={styles.footerActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmBtnText}>Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
