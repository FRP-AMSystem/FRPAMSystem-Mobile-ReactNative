import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getExperiments } from "../../api/experimentApi";
import { CreateExperimentModal } from "../../components/CreateExperimentModal";
import { ExperimentDetailModal } from "../../components/ExperimentDetailModal";
import { Colors } from "../../constants/colors";
import { styles } from "../../styles/experiments.styles";
import { ExperimentItem, ExperimentStatus } from "../../types/experiment";

type TabFilter = "all" | "Running" | "Draft" | "Pending" | "Approved" | "Completed";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function ExperimentsScreen() {
  const [experiments, setExperiments] = useState<ExperimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabFilter, setTabFilter] = useState<TabFilter>("all");

  // Modal States
  const [selectedExp, setSelectedExp] = useState<ExperimentItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getExperiments();
      setExperiments(data || []);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể tải danh sách đề tài thử nghiệm.");
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

  const filteredExperiments = useMemo(() => {
    return experiments.filter((item) => {
      const matchesTab = tabFilter === "all" || item.status === tabFilter;
      if (!matchesTab) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const name = (item.experimentName || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const researcher = (item.researcherName || "").toLowerCase();

      return name.includes(q) || desc.includes(q) || researcher.includes(q);
    });
  }, [experiments, tabFilter, searchTerm]);

  const getStatusBadge = (status?: ExperimentStatus) => {
    switch (status) {
      case "Running":
        return { label: "Đang chạy", bg: "#f0fdf4", text: "#15803d", border: "#86efac" };
      case "Approved":
        return { label: "Đã duyệt", bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" };
      case "Pending":
        return { label: "Chờ duyệt", bg: "#fffbeb", text: "#b45309", border: "#fde68a" };
      case "Completed":
        return { label: "Hoàn tất", bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" };
      case "Rejected":
        return { label: "Từ chối", bg: "#fef2f2", text: "#b91c1c", border: "#fca5a5" };
      case "Draft":
      default:
        return { label: "Bản nháp", bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Đề tài Nghiên cứu</Text>
          <Text style={styles.headerSubtitle}>Quản lý và theo dõi tiến độ khảo nghiệm lâm nghiệp</Text>
        </View>

        <TouchableOpacity
          style={styles.createHeaderBtn}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.createHeaderBtnText}>Tạo mới</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên đề tài, mục tiêu nghiên cứu..."
          placeholderTextColor="#94a3b8"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabFilterScroll}
        contentContainerStyle={styles.tabFilterRow}
      >
        {[
          { key: "all", label: "Tất cả" },
          { key: "Running", label: "Đang chạy" },
          { key: "Draft", label: "Bản nháp" },
          { key: "Pending", label: "Chờ duyệt" },
          { key: "Approved", label: "Đã duyệt" },
          { key: "Completed", label: "Hoàn tất" },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabFilterBtn, tabFilter === t.key && styles.tabFilterBtnActive]}
            onPress={() => setTabFilter(t.key as TabFilter)}
          >
            <Text style={[styles.tabFilterText, tabFilter === t.key && styles.tabFilterTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách đề tài...</Text>
        </View>
      ) : filteredExperiments.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="flask-outline" size={36} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có đề tài nào</Text>
          <Text style={styles.emptyText}>Bấm nút "Tạo mới" để đăng ký đề tài thử nghiệm lâm nghiệp.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExperiments}
          keyExtractor={(item) => String(item.experimentId)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  setSelectedExp(item);
                  setDetailModalVisible(true);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.expName} numberOfLines={2}>
                    {item.experimentName}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                {item.description ? (
                  <Text style={styles.descText} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>
                    Thời gian: {formatDate(item.expectStartDate)} đến {formatDate(item.expectEndDate)}
                  </Text>
                </View>

                {item.researcherName ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>Chủ nhiệm: {item.researcherName}</Text>
                  </View>
                ) : null}

                <View style={styles.cardFooter}>
                  <Text style={{ fontSize: 11.5, color: Colors.textMuted }}>
                    Hạn chót: {formatDate(item.deadline)}
                  </Text>
                  <View style={styles.detailLink}>
                    <Text style={styles.detailLinkText}>Chi tiết đề tài</Text>
                    <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Modals */}
      <ExperimentDetailModal
        visible={detailModalVisible}
        experiment={selectedExp}
        onClose={() => setDetailModalVisible(false)}
        onSuccess={loadData}
      />

      <CreateExperimentModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={loadData}
      />
    </SafeAreaView>
  );
}
