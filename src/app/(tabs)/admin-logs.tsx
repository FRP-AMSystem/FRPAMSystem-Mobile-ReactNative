import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getAuditLogs } from "../../api/auditLogApi";
import { AuditLogItem } from "../../types/auditLog";
import { AuditLogDetailModal } from "../../components/AuditLogDetailModal";
import { Colors } from "../../constants/colors";
import { styles } from "../../styles/admin-logs.styles";

const MODULE_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "Auth", label: "Xác thực" },
  { key: "Experiment", label: "Đề tài" },
  { key: "AllocationPlan", label: "Phân bổ" },
  { key: "Equipment", label: "Thiết bị" },
  { key: "User", label: "Người dùng" },
  { key: "Schedule", label: "Lịch trực" },
];

export default function AdminLogsScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      const data = await getAuditLogs({ Size: 100 });
      setLogs(data);
    } catch (err) {
      console.error("Load audit logs error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      (l.action || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.module || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.userFullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.details || "").toLowerCase().includes(search.toLowerCase());

    const matchesModule =
      selectedModule === "all" ||
      (l.module || "").toLowerCase().includes(selectedModule.toLowerCase());

    return matchesSearch && matchesModule;
  });

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top > 0 ? insets.top : 8 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nhật ký Hoạt động (Audit Logs)</Text>
        <Text style={styles.subtitle}>
          Theo dõi giám sát mọi thao tác và sự kiện trên hệ thống
        </Text>

        {/* Module Filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MODULE_FILTERS}
          keyExtractor={(item) => item.key}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterChips}
          renderItem={({ item }) => {
            const isActive = selectedModule === item.key;
            return (
              <TouchableOpacity
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedModule(item.key)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo hành động, người thực hiện, phân hệ..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Log List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải nhật ký hệ thống...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) =>
            String(item.auditLogId || item.id || Math.random())
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="shield-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Không tìm thấy nhật ký hoạt động phù hợp.</Text>
            </View>
          }
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={styles.logCard}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedLog(item);
                  setDetailModalVisible(true);
                }}
              >
                <View style={styles.logCardTop}>
                  <View style={styles.modulePill}>
                    <Text style={styles.moduleText}>
                      {item.module || "Hệ thống"}
                    </Text>
                  </View>
                  <Text style={styles.timestampText}>
                    {formatTime(item.timestamp || item.createdAt)}
                  </Text>
                </View>

                <Text style={styles.actionTitle}>{item.action}</Text>

                {item.details ? (
                  <Text style={styles.detailsSnippet} numberOfLines={2}>
                    {item.details}
                  </Text>
                ) : null}

                <View style={styles.logFooter}>
                  <View style={styles.userWrap}>
                    <Ionicons name="person-circle-outline" size={16} color="#64748b" />
                    <Text style={styles.userNameText}>
                      {item.userFullName || item.username || "Hệ thống"}
                    </Text>
                  </View>
                  <Text style={styles.viewDetailText}>Chi tiết →</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Detail Modal */}
      <AuditLogDetailModal
        visible={detailModalVisible}
        log={selectedLog}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedLog(null);
        }}
      />
    </View>
  );
}
