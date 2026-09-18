import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { getDashboardMetrics, DashboardMetrics } from "../../api/dashboardApi";
import { getExperiments } from "../../api/experimentApi";
import { getAllocationPlans } from "../../api/allocationPlanApi";
import { ExperimentItem } from "../../types/experiment";
import { AllocationPlanItem } from "../../types/allocationPlan";
import { ExperimentDetailModal } from "../../components/ExperimentDetailModal";
import { AllocationPlanDetailModal } from "../../components/AllocationPlanDetailModal";
import { Colors } from "../../constants/colors";
import { styles } from "../../styles/dashboard.styles";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [pendingExps, setPendingExps] = useState<ExperimentItem[]>([]);
  const [pendingPlans, setPendingPlans] = useState<AllocationPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [selectedExp, setSelectedExp] = useState<ExperimentItem | null>(null);
  const [expModalVisible, setExpModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<AllocationPlanItem | null>(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [m, exps, plans] = await Promise.all([
        getDashboardMetrics(),
        getExperiments({ Size: 20 }),
        getAllocationPlans({ Size: 20 }),
      ]);

      setMetrics(m);

      // Filter pending items
      const pExps = (exps || []).filter((e) =>
        ["submitted", "under_review", "pending", "draft"].includes(
          (e.status || "").toLowerCase()
        )
      );
      setPendingExps(pExps);

      const pPlans = (plans || []).filter((p) =>
        ["pending", "draft", "optimized", "submitted"].includes(
          (p.approveStatus || "").toLowerCase()
        )
      );
      setPendingPlans(pPlans);
    } catch (err) {
      console.error("Load dashboard data error:", err);
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

  const totalPending = pendingExps.length + pendingPlans.length;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top > 0 ? insets.top : 8 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.greetingWrap}>
            <Text style={styles.welcomeText}>Bảng điều khiển Quản lý</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.fullName || "Quản lý hệ thống"}
            </Text>
          </View>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            <Text style={styles.roleText}>Manager</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải chỉ số điều hành...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* KPI Metrics */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Chỉ số Hoạt động</Text>
          </View>

          <View style={styles.metricsGrid}>
            {/* 1. Tổng đề tài */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBox, { backgroundColor: "#ecfdf5" }]}>
                  <Ionicons name="flask" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.metricValue}>{metrics?.totalExperiments || 0}</Text>
              </View>
              <Text style={styles.metricLabel}>Tổng đề tài</Text>
            </View>

            {/* 2. Đang khảo nghiệm */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBox, { backgroundColor: "#eff6ff" }]}>
                  <Ionicons name="play-circle" size={20} color="#2563eb" />
                </View>
                <Text style={[styles.metricValue, { color: "#2563eb" }]}>
                  {metrics?.runningExperiments || 0}
                </Text>
              </View>
              <Text style={styles.metricLabel}>Đang thực hiện</Text>
            </View>

            {/* 3. Chờ thẩm định */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBox, { backgroundColor: "#fef3c7" }]}>
                  <Ionicons name="time" size={20} color="#d97706" />
                </View>
                <Text style={[styles.metricValue, { color: "#d97706" }]}>
                  {totalPending}
                </Text>
              </View>
              <Text style={styles.metricLabel}>Cần thẩm định</Text>
            </View>

            {/* 4. Kế hoạch phân bổ */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBox, { backgroundColor: "#faf5ff" }]}>
                  <Ionicons name="git-network" size={20} color="#9333ea" />
                </View>
                <Text style={[styles.metricValue, { color: "#9333ea" }]}>
                  {metrics?.totalAllocationPlans || 0}
                </Text>
              </View>
              <Text style={styles.metricLabel}>Kế hoạch phân bổ</Text>
            </View>

            {/* 5. Thiết bị vận hành */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBox, { backgroundColor: "#f0fdf4" }]}>
                  <Ionicons name="construct" size={20} color="#16a34a" />
                </View>
                <Text style={[styles.metricValue, { color: "#16a34a" }]}>
                  {metrics?.inUseEquipment || 0}/{metrics?.totalEquipment || 0}
                </Text>
              </View>
              <Text style={styles.metricLabel}>Máy đang dùng</Text>
            </View>

            {/* 6. Nhân sự hiện trường */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBox, { backgroundColor: "#fdf2f8" }]}>
                  <Ionicons name="people" size={20} color="#db2777" />
                </View>
                <Text style={[styles.metricValue, { color: "#db2777" }]}>
                  {metrics?.totalStaff || 0}
                </Text>
              </View>
              <Text style={styles.metricLabel}>Tổng nhân sự</Text>
            </View>
          </View>

          {/* Urgent Approvals Section */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Yêu cầu Chờ Phê duyệt</Text>
            {totalPending > 0 ? (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{totalPending} mục</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.urgentList}>
            {totalPending === 0 ? (
              <View style={styles.emptyUrgentCard}>
                <Ionicons name="checkmark-done-circle" size={40} color="#16a34a" />
                <Text style={styles.emptyUrgentText}>
                  Tuyệt vời! Hiện không có yêu cầu nào đang chờ thẩm định.
                </Text>
              </View>
            ) : (
              <>
                {/* Pending Experiments */}
                {pendingExps.map((exp) => (
                  <TouchableOpacity
                    key={`exp-${exp.experimentId}`}
                    style={styles.urgentCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedExp(exp);
                      setExpModalVisible(true);
                    }}
                  >
                    <View style={styles.urgentCardTop}>
                      <View style={styles.urgentTypePill}>
                        <Text style={styles.urgentTypeText}>Đề tài mới</Text>
                      </View>
                      <Text style={styles.urgentTime}>
                        {exp.status || "Chờ duyệt"}
                      </Text>
                    </View>
                    <Text style={styles.urgentTitle} numberOfLines={2}>
                      {exp.experimentName}
                    </Text>
                    <View style={styles.urgentMetaRow}>
                      <Text style={styles.urgentAuthor}>
                        Chủ nhiệm: {exp.researcherName || "Nghiên cứu viên"}
                      </Text>
                      <View style={styles.urgentActionBtn}>
                        <Ionicons name="eye-outline" size={14} color="#ffffff" />
                        <Text style={styles.urgentActionText}>Thẩm định</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Pending Plans */}
                {pendingPlans.map((plan) => (
                  <TouchableOpacity
                    key={`plan-${plan.allocationPlanId}`}
                    style={[styles.urgentCard, { borderColor: "#c084fc" }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedPlan(plan);
                      setPlanModalVisible(true);
                    }}
                  >
                    <View style={styles.urgentCardTop}>
                      <View style={[styles.urgentTypePill, { backgroundColor: "#faf5ff" }]}>
                        <Text style={[styles.urgentTypeText, { color: "#7e22ce" }]}>
                          Kế hoạch phân bổ
                        </Text>
                      </View>
                      <Text style={styles.urgentTime}>
                        {plan.approveStatus || "Chờ duyệt"}
                      </Text>
                    </View>
                    <Text style={styles.urgentTitle} numberOfLines={2}>
                      {plan.experimentName || "Kế hoạch Phân bổ Tài nguyên"}
                    </Text>
                    <View style={styles.urgentMetaRow}>
                      <Text style={styles.urgentAuthor}>
                        Độ tối ưu: {plan.fitnessScore ? `${plan.fitnessScore}%` : "GA Tối ưu"}
                      </Text>
                      <View style={[styles.urgentActionBtn, { backgroundColor: "#7e22ce" }]}>
                        <Ionicons name="eye-outline" size={14} color="#ffffff" />
                        <Text style={styles.urgentActionText}>Duyệt phân bổ</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>

          {/* Resource Utilization */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Tỷ lệ Khai thác Tài nguyên</Text>
          </View>

          <View style={styles.resourceSummaryCard}>
            {/* Equipment usage */}
            <View style={styles.resourceRow}>
              <View style={styles.resourceRowHeader}>
                <Text style={styles.resourceLabel}>Trang thiết bị & Máy móc</Text>
                <Text style={styles.resourceValue}>
                  {metrics?.totalEquipment
                    ? Math.round(
                        ((metrics.inUseEquipment || 0) / metrics.totalEquipment) * 100
                      )
                    : 0}
                  %
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${
                        metrics?.totalEquipment
                          ? Math.min(
                              Math.round(
                                ((metrics.inUseEquipment || 0) /
                                  metrics.totalEquipment) *
                                  100
                              ),
                              100
                            )
                          : 0
                      }%`,
                      backgroundColor: Colors.primary,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Maintenance */}
            <View style={styles.resourceRow}>
              <View style={styles.resourceRowHeader}>
                <Text style={styles.resourceLabel}>Thiết bị bảo trì / sửa chữa</Text>
                <Text style={styles.resourceValue}>
                  {metrics?.totalEquipment
                    ? Math.round(
                        ((metrics.maintenanceEquipment || 0) /
                          metrics.totalEquipment) *
                          100
                      )
                    : 0}
                  %
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${
                        metrics?.totalEquipment
                          ? Math.min(
                              Math.round(
                                ((metrics.maintenanceEquipment || 0) /
                                  metrics.totalEquipment) *
                                  100
                              ),
                              100
                            )
                          : 0
                      }%`,
                      backgroundColor: "#f59e0b",
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Modals */}
      <ExperimentDetailModal
        visible={expModalVisible}
        experiment={selectedExp}
        onClose={() => {
          setExpModalVisible(false);
          setSelectedExp(null);
        }}
        onSuccess={loadData}
      />

      <AllocationPlanDetailModal
        visible={planModalVisible}
        plan={selectedPlan}
        onClose={() => {
          setPlanModalVisible(false);
          setSelectedPlan(null);
        }}
        onSuccess={loadData}
      />
    </View>
  );
}
