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
import { getAllocationPlans } from "../../api/allocationPlanApi";
import { AllocationPlanDetailModal } from "../../components/AllocationPlanDetailModal";
import { Colors } from "../../constants/colors";
import { styles } from "../../styles/allocation-plans.styles";
import { AllocationPlanItem, AllocationPlanStatus } from "../../types/allocationPlan";

type TabFilter = "all" | "Approved" | "Pending" | "Draft" | "Rejected";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatFitnessScore(score?: number | null): string {
  if (score == null) return "--";
  const num = Number(score);
  if (isNaN(num)) return "--";
  const val = num > 1 ? num : num * 100;
  return `${val.toFixed(1).replace(/\.0$/, "")}%`;
}

export default function AllocationPlansScreen() {
  const [plans, setPlans] = useState<AllocationPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabFilter, setTabFilter] = useState<TabFilter>("all");

  // Modal State
  const [selectedPlan, setSelectedPlan] = useState<AllocationPlanItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllocationPlans();
      setPlans(data || []);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể tải danh sách kế hoạch phân bổ.");
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

  const filteredPlans = useMemo(() => {
    return plans.filter((item) => {
      const matchesTab = tabFilter === "all" || item.approveStatus === tabFilter;
      if (!matchesTab) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const expName = (item.experimentName || "").toLowerCase();
      const creator = (item.createdByName || "").toLowerCase();

      return expName.includes(q) || creator.includes(q);
    });
  }, [plans, tabFilter, searchTerm]);

  const getStatusBadge = (status?: AllocationPlanStatus) => {
    switch (status) {
      case "Approved":
        return { label: "Đã duyệt", bg: "#f0fdf4", text: "#15803d", border: "#86efac" };
      case "Pending":
        return { label: "Chờ duyệt", bg: "#fffbeb", text: "#b45309", border: "#fde68a" };
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
          <Text style={styles.headerTitle}>Kế hoạch Phân bổ</Text>
          <Text style={styles.headerSubtitle}>Tối ưu hóa máy móc, nhân sự và quỹ đất</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên đề tài..."
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
          { key: "Approved", label: "Đã duyệt" },
          { key: "Pending", label: "Chờ duyệt" },
          { key: "Draft", label: "Bản nháp" },
          { key: "Rejected", label: "Từ chối" },
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
          <Text style={styles.loadingText}>Đang tải danh sách kế hoạch...</Text>
        </View>
      ) : filteredPlans.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="git-network-outline" size={36} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có kế hoạch phân bổ nào</Text>
          <Text style={styles.emptyText}>Các phương án phân bổ tài nguyên sau khi tạo sẽ hiển thị tại đây.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlans}
          keyExtractor={(item) => String(item.allocationPlanId)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.approveStatus);

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  setSelectedPlan(item);
                  setDetailModalVisible(true);
                }}
                activeOpacity={0.75}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.planExpName} numberOfLines={2}>
                    {item.experimentName || "Kế hoạch Phân bổ Tài nguyên"}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                {item.fitnessScore != null ? (
                  <View style={styles.scoreRow}>
                    <Ionicons name="sparkles" size={14} color="#6366f1" />
                    <Text style={styles.scoreText}>
                      Độ tối ưu: {formatFitnessScore(item.fitnessScore)}
                    </Text>
                  </View>
                ) : null}

                {/* Resource Summary Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Ionicons name="construct-outline" size={16} color="#d97706" />
                    <Text style={styles.statValue}>{item.equipmentDetailCount ?? "-"}</Text>
                    <Text style={styles.statLabel}>Thiết bị</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={16} color="#9333ea" />
                    <Text style={styles.statValue}>{item.humanDetailCount ?? "-"}</Text>
                    <Text style={styles.statLabel}>Nhân lực</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="leaf-outline" size={16} color="#16a34a" />
                    <Text style={styles.statValue}>{item.landDetailCount ?? "-"}</Text>
                    <Text style={styles.statLabel}>Khu đất</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.footerDate}>
                    Ngày tạo: {formatDate(item.createdAt)}
                  </Text>
                  <View style={styles.detailLink}>
                    <Text style={styles.detailLinkText}>Xem chi tiết</Text>
                    <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Modal */}
      <AllocationPlanDetailModal
        visible={detailModalVisible}
        plan={selectedPlan}
        onClose={() => setDetailModalVisible(false)}
      />
    </SafeAreaView>
  );
}
