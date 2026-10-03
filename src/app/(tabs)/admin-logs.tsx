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
import { AuditLogDetailModal, resolveLogSeverity } from "../../components/AuditLogDetailModal";
import { Colors } from "../../constants/colors";
import { styles } from "../../styles/admin-logs.styles";

const MODULE_FILTERS = [
  { key: "ALL", label: "All Modules" },
  { key: "Experiments", label: "Experiments" },
  { key: "ExperimentPhases", label: "Phases" },
  { key: "ExperimentEquipmentRequirements", label: "Equipment Reqs" },
  { key: "ExperimentHumanRequirements", label: "Human Reqs" },
  { key: "ExperimentLandRequirements", label: "Land Reqs" },
  { key: "AllocationPlans", label: "Allocation Plans" },
  { key: "Auth", label: "Auth & Users" },
  { key: "Notifications", label: "Notifications" },
];

export default function AdminLogsScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAuditLogs({
        page: 1,
        pageSize: 100,
        search: search.trim() || undefined,
        module: selectedModule !== "ALL" ? selectedModule : undefined,
      });
      setLogs(res.items);
    } catch (err) {
      console.error("Load audit logs error:", err);
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedModule]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs();
  };

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;

    const matchesSearch =
      (l.action || "").toLowerCase().includes(q) ||
      (l.module || "").toLowerCase().includes(q) ||
      (l.actorFullName || "").toLowerCase().includes(q) ||
      (l.actorUsername || "").toLowerCase().includes(q) ||
      (l.actorRoleName || "").toLowerCase().includes(q) ||
      (l.description || "").toLowerCase().includes(q) ||
      (l.metadata || "").toLowerCase().includes(q);

    return matchesSearch;
  });

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    try {
      const d = new Date(timeStr);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
        <Text style={styles.title}>System Audit Logs</Text>
        <Text style={styles.subtitle}>
          Traceability and compliance monitoring of all system events & API activities
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
            placeholder="Search action, description, actor, or path..."
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
          <Text style={styles.loadingText}>Loading audit logs from server...</Text>
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
              <Text style={styles.emptyText}>No matching audit logs found.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const sevInfo = resolveLogSeverity(item);
            const actorName =
              item.actorFullName || item.actorUsername || item.userFullName || item.username || "System / Anonymous";
            const actorRole = item.actorRoleName || item.roleName;

            return (
              <TouchableOpacity
                style={styles.logCard}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedLog(item);
                  setDetailModalVisible(true);
                }}
              >
                {/* Card Top: Module + Status Badge + Timestamp */}
                <View style={styles.logCardTop}>
                  <View style={styles.modulePill}>
                    <Text style={styles.moduleText}>
                      {item.module || "General"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: sevInfo.bg, borderColor: sevInfo.border },
                    ]}
                  >
                    <Ionicons
                      name={
                        sevInfo.type === "success"
                          ? "checkmark-circle"
                          : sevInfo.type === "error"
                          ? "close-circle"
                          : sevInfo.type === "warning"
                          ? "alert-circle"
                          : "information-circle"
                      }
                      size={12}
                      color={sevInfo.text}
                    />
                    <Text style={[styles.statusBadgeText, { color: sevInfo.text }]}>
                      {sevInfo.label}
                    </Text>
                  </View>

                  <Text style={styles.timestampText}>
                    {formatTime(item.createdAt || item.timestamp)}
                  </Text>
                </View>

                {/* Action Title */}
                <Text style={styles.actionTitle}>{item.action || "Execute"}</Text>

                {/* Description Snippet */}
                {item.description ? (
                  <Text style={styles.detailsSnippet} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                {/* Card Footer: Actor & View Button */}
                <View style={styles.logFooter}>
                  <View style={styles.userWrap}>
                    <Ionicons name="person-circle-outline" size={16} color="#64748b" />
                    <Text style={styles.userNameText} numberOfLines={1}>
                      {actorName}
                    </Text>
                    {actorRole ? (
                      <Text style={styles.roleTagText}>({actorRole})</Text>
                    ) : null}
                  </View>
                  <Text style={styles.viewDetailText}>View →</Text>
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
