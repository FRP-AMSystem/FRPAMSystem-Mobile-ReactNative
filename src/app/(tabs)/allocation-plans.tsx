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
import { getExperiments } from "../../api/experimentApi";
import { AllocationPlanDetailModal } from "../../components/AllocationPlanDetailModal";
import { AllocateResourcesModal } from "../../components/AllocateResourcesModal";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { styles } from "../../styles/allocation-plans.styles";
import { AllocationPlanItem, AllocationPlanStatus } from "../../types/allocationPlan";
import { ExperimentItem } from "../../types/experiment";

type TabFilter = "all" | "Approved" | "Pending" | "Draft" | "Rejected";
type ViewMode = "plans" | "ready";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 2000) return "-";
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
  return `${val.toFixed(1).replace(/\.0$/, "")}`;
}

export default function AllocationPlansScreen() {
  const { isResearcher, isManager, isAdmin, user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("plans");
  const [plans, setPlans] = useState<AllocationPlanItem[]>([]);
  const [readyExperiments, setReadyExperiments] = useState<ExperimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabFilter, setTabFilter] = useState<TabFilter>("all");

  // Modals
  const [selectedPlan, setSelectedPlan] = useState<AllocationPlanItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const [selectedExpForAllocation, setSelectedExpForAllocation] = useState<ExperimentItem | null>(null);
  const [allocateModalVisible, setAllocateModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (isResearcher && !isManager && !isAdmin && user?.userId) {
        params.CreatedBy = user.userId;
      }

      const [plansData, expsData] = await Promise.allSettled([
        getAllocationPlans(params),
        getExperiments({ Size: 100 }),
      ]);

      const allPlans = plansData.status === "fulfilled" ? plansData.value || [] : [];
      const allExps = expsData.status === "fulfilled" ? expsData.value || [] : [];

      // 1. Filter experiments belonging to current researcher
      let relevantExps = allExps;
      if (isResearcher && !isManager && !isAdmin && user?.userId) {
        relevantExps = allExps.filter(
          (exp) => Number(exp.researcherId) === Number(user.userId)
        );
      }

      const myExpIdSet = new Set(relevantExps.map((e) => Number(e.experimentId)));

      // 2. Filter allocation plans belonging to current researcher (by creator or by experiment ownership)
      let list = allPlans;
      if (isResearcher && !isManager && !isAdmin && user?.userId) {
        list = allPlans.filter((plan) => {
          const matchCreator = Number(plan.createdBy) === Number(user.userId);
          const matchExp = plan.experimentId && myExpIdSet.has(Number(plan.experimentId));
          return matchCreator || matchExp;
        });
      }
      if (isManager) {
        list = list.filter((plan) => {
          const st = String(plan.approveStatus || "").toLowerCase().trim();
          return st !== "draft" && st !== "created" && st !== "0";
        });
      }
      setPlans(list);

      // 3. Filter experiments that are Planning or Approved for allocation (strictly researcher's own)
      const readyList = relevantExps.filter((exp) => {
        const st = String(exp.status || "").toLowerCase().trim();
        return (
          st === "planning" ||
          st === "approved" ||
          st.includes("plan") ||
          st.includes("approv")
        );
      });
      setReadyExperiments(readyList);

      // Auto switch to ready tab if there are ready experiments and no existing plans
      if (list.length === 0 && readyList.length > 0) {
        setViewMode("ready");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", "Failed to load allocation plans and experiments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isResearcher, isManager, isAdmin, user?.userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filterTabs = useMemo(() => {
    const tabs: { key: TabFilter; label: string }[] = [
      { key: "all", label: "All" },
      { key: "Approved", label: "Approved" },
      { key: "Pending", label: "Pending" },
      { key: "Draft", label: "Draft" },
      { key: "Rejected", label: "Rejected" },
    ];
    if (isManager) {
      return tabs.filter((t) => t.key !== "Draft");
    }
    return tabs;
  }, [isManager]);

  const filteredPlans = useMemo(() => {
    return plans.filter((item) => {
      const st = String(item.approveStatus || "").toLowerCase().trim();
      if (isManager && (st === "draft" || st === "created" || st === "0")) {
        return false;
      }
      const matchesTab =
        tabFilter === "all" ||
        st === tabFilter.toLowerCase();
      if (!matchesTab) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const expName = (item.experimentName || "").toLowerCase();
      const creator = (item.createdByName || "").toLowerCase();

      return expName.includes(q) || creator.includes(q);
    });
  }, [plans, tabFilter, searchTerm, isManager]);

  const filteredReadyExperiments = useMemo(() => {
    return readyExperiments.filter((exp) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const name = (exp.experimentName || "").toLowerCase();
      const desc = (exp.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [readyExperiments, searchTerm]);

  const getStatusBadge = (status?: AllocationPlanStatus) => {
    switch (status) {
      case "Approved":
        return { label: "Approved", bg: "#f0fdf4", text: "#15803d", border: "#86efac" };
      case "Pending":
        return { label: "Pending", bg: "#fffbeb", text: "#b45309", border: "#fde68a" };
      case "Rejected":
        return { label: "Rejected", bg: "#fef2f2", text: "#b91c1c", border: "#fca5a5" };
      case "Draft":
      default:
        return { label: "Draft", bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
    }
  };

  const handleStartAllocation = (exp: ExperimentItem) => {
    setSelectedExpForAllocation(exp);
    setAllocateModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Resource Allocation</Text>
          <Text style={styles.headerSubtitle}>Optimize equipment, personnel, and land plots</Text>
        </View>

        {readyExperiments.length > 0 && (
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => {
              if (readyExperiments.length === 1) {
                handleStartAllocation(readyExperiments[0]);
              } else {
                setViewMode("ready");
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={16} color={Colors.primary} />
            <Text style={styles.headerActionText}>+ Allocate</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeSwitcher}>
        <TouchableOpacity
          style={[styles.modeBtn, viewMode === "plans" && styles.modeBtnActive]}
          onPress={() => setViewMode("plans")}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeBtnText, viewMode === "plans" && styles.modeBtnTextActive]}>
            Allocation Plans
          </Text>
          <View style={[styles.modeBadge, viewMode === "plans" && styles.modeBadgeActive]}>
            <Text style={[styles.modeBadgeText, viewMode === "plans" && styles.modeBadgeTextActive]}>
              {plans.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, viewMode === "ready" && styles.modeBtnActive]}
          onPress={() => setViewMode("ready")}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeBtnText, viewMode === "ready" && styles.modeBtnTextActive]}>
            Ready for Allocation
          </Text>
          <View style={[styles.modeBadge, viewMode === "ready" && styles.modeBadgeActive]}>
            <Text style={[styles.modeBadgeText, viewMode === "ready" && styles.modeBadgeTextActive]}>
              {readyExperiments.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Planning Alert Banner when on plans view */}
      {readyExperiments.length > 0 && viewMode === "plans" && (
        <View style={styles.planningAlertBanner}>
          <View style={styles.planningAlertLeft}>
            <Ionicons name="sparkles" size={18} color="#7c3aed" />
            <View style={{ flex: 1 }}>
              <Text style={styles.planningAlertTitle}>
                {readyExperiments.length} Experiment(s) in Planning
              </Text>
              <Text style={styles.planningAlertSub} numberOfLines={1}>
                {readyExperiments[0].experimentName}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.planningAlertBtn}
            onPress={() => handleStartAllocation(readyExperiments[0])}
            activeOpacity={0.8}
          >
            <Text style={styles.planningAlertBtnText}>Allocate</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            viewMode === "plans"
              ? "Search by experiment name..."
              : "Search ready experiments..."
          }
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

      {/* Filter Tabs (Only for Plans view) */}
      {viewMode === "plans" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabFilterScroll}
          contentContainerStyle={styles.tabFilterRow}
        >
          {filterTabs.map((t) => (
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
      )}

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : viewMode === "plans" ? (
        /* 1. ALLOCATION PLANS LIST */
        filteredPlans.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="git-network-outline" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No allocation plans found</Text>
            <Text style={styles.emptyText}>
              Resource allocation plans will appear here once created.
            </Text>
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
                      {item.experimentName || "Resource Allocation Plan"}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>

                  {item.fitnessScore != null ? (
                    <View style={styles.scoreRow}>
                      <Ionicons name="sparkles" size={14} color="#6366f1" />
                      <Text style={styles.scoreText}>
                        Fitness Score: {formatFitnessScore(item.fitnessScore)}
                      </Text>
                    </View>
                  ) : null}

                  {/* Resource Summary Grid */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Ionicons name="construct-outline" size={16} color="#d97706" />
                      <Text style={styles.statValue}>{item.equipmentDetailCount ?? "-"}</Text>
                      <Text style={styles.statLabel}>Equipment</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Ionicons name="people-outline" size={16} color="#9333ea" />
                      <Text style={styles.statValue}>{item.humanDetailCount ?? "-"}</Text>
                      <Text style={styles.statLabel}>Personnel</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Ionicons name="leaf-outline" size={16} color="#16a34a" />
                      <Text style={styles.statValue}>{item.landDetailCount ?? "-"}</Text>
                      <Text style={styles.statLabel}>Land</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.footerDate}>
                      Created: {formatDate(item.createdAt)}
                    </Text>
                    <View style={styles.detailLink}>
                      <Text style={styles.detailLinkText}>View Details</Text>
                      <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )
      ) : (
        /* 2. READY EXPERIMENTS FOR ALLOCATION */
        filteredReadyExperiments.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="flask-outline" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No experiments awaiting allocation</Text>
            <Text style={styles.emptyText}>
              Experiments approved by the Manager (in Planning or Approved status) will appear here for resource allocation.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredReadyExperiments}
            keyExtractor={(item) => String(item.experimentId)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.readyCard}>
                <View style={styles.readyCardHeader}>
                  <Text style={styles.readyExpTitle} numberOfLines={2}>
                    {item.experimentName}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: "#f0fdf4", borderColor: "#86efac" },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: "#15803d" }]}>
                      {item.status || "Approved"}
                    </Text>
                  </View>
                </View>

                {item.description ? (
                  <Text style={styles.readyExpDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.readyInfoRow}>
                  <Ionicons name="calendar-outline" size={15} color="#64748b" />
                  <Text style={styles.readyInfoText}>
                    {formatDate(item.expectStartDate)} ➔ {formatDate(item.expectEndDate)}
                  </Text>
                </View>

                {/* Allocate Action Button */}
                <TouchableOpacity
                  style={styles.allocateActionBtn}
                  onPress={() => handleStartAllocation(item)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cube-outline" size={16} color="#ffffff" />
                  <Text style={styles.allocateActionText}>
                    Allocate Resources & AI Optimizer
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )
      )}

      {/* Detail Modal */}
      <AllocationPlanDetailModal
        visible={detailModalVisible}
        plan={selectedPlan}
        onClose={() => setDetailModalVisible(false)}
        onSuccess={loadData}
      />

      {/* Resource Allocation & AI Optimizer Modal */}
      <AllocateResourcesModal
        visible={allocateModalVisible}
        experiment={selectedExpForAllocation}
        onClose={() => {
          setAllocateModalVisible(false);
          setSelectedExpForAllocation(null);
        }}
        onSuccess={loadData}
      />
    </SafeAreaView>
  );
}
