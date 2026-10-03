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
  const { user, isResearcher, isManager, isAdmin } = useAuth();

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
        getExperiments({ Size: 50 }),
        getAllocationPlans({ Size: 50 }),
      ]);

      setMetrics(m);

      let rawExps = exps || [];
      let rawPlans = plans || [];

      if (isResearcher && !isManager && !isAdmin && user?.userId) {
        rawExps = rawExps.filter(
          (e) => Number(e.researcherId) === Number(user.userId)
        );
        const myExpIds = new Set(rawExps.map((e) => Number(e.experimentId)));
        rawPlans = rawPlans.filter((p) => {
          const matchCreator = Number(p.createdBy) === Number(user.userId);
          const matchExp = p.experimentId && myExpIds.has(Number(p.experimentId));
          return matchCreator || matchExp;
        });
      }

      // Filter pending items
      const pExps = rawExps.filter((e) =>
        ["submitted", "under_review", "pending", "draft"].includes(
          (e.status || "").toLowerCase()
        )
      );
      setPendingExps(pExps);

      const pPlans = rawPlans.filter((p) =>
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
  }, [isResearcher, isManager, isAdmin, user?.userId]);

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
            <Text style={styles.welcomeText}>Manager Dashboard</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.fullName || "System Manager"}
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
          <Text style={styles.loadingText}>Loading dashboard metrics...</Text>
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
            <Text style={styles.sectionTitle}>Operational KPIs</Text>
          </View>

          <View style={styles.metricsGrid}>
            {/* 1. Total Experiments */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBox, { backgroundColor: "#ecfdf5" }]}>
                  <Ionicons name="flask" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.metricValue}>{metrics?.totalExperiments || 0}</Text>
              </View>
              <Text style={styles.metricLabel}>Total Experiments</Text>
            </View>

            {/* 2. Running */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBox, { backgroundColor: "#eff6ff" }]}>
                  <Ionicons name="play-circle" size={20} color="#2563eb" />
                </View>
                <Text style={[styles.metricValue, { color: "#2563eb" }]}>
                  {metrics?.runningExperiments || 0}
                </Text>
              </View>
              <Text style={styles.metricLabel}>In Progress</Text>
            </View>

            {/* 3. Pending Review */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBox, { backgroundColor: "#fef3c7" }]}>
                  <Ionicons name="time" size={20} color="#d97706" />
                </View>
                <Text style={[styles.metricValue, { color: "#d97706" }]}>
                  {totalPending}
                </Text>
              </View>
              <Text style={styles.metricLabel}>Pending Review</Text>
            </View>

            {/* 4. Allocation Plans */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBox, { backgroundColor: "#faf5ff" }]}>
                  <Ionicons name="git-network" size={20} color="#9333ea" />
                </View>
                <Text style={[styles.metricValue, { color: "#9333ea" }]}>
                  {metrics?.totalAllocationPlans || 0}
                </Text>
              </View>
              <Text style={styles.metricLabel}>Allocation Plans</Text>
            </View>

            {/* 5. In-Use Equipment */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBox, { backgroundColor: "#f0fdf4" }]}>
                  <Ionicons name="construct" size={20} color="#16a34a" />
                </View>
                <Text style={[styles.metricValue, { color: "#16a34a" }]}>
                  {metrics?.inUseEquipment || 0}/{metrics?.totalEquipment || 0}
                </Text>
              </View>
              <Text style={styles.metricLabel}>Active Equipment</Text>
            </View>

            {/* 6. Total Staff */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBox, { backgroundColor: "#fdf2f8" }]}>
                  <Ionicons name="people" size={20} color="#db2777" />
                </View>
                <Text style={[styles.metricValue, { color: "#db2777" }]}>
                  {metrics?.totalStaff || 0}
                </Text>
              </View>
              <Text style={styles.metricLabel}>Total Staff</Text>
            </View>
          </View>

          {/* Urgent Approvals Section */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Pending Approvals</Text>
            {totalPending > 0 ? (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{totalPending} items</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.urgentList}>
            {totalPending === 0 ? (
              <View style={styles.emptyUrgentCard}>
                <Ionicons name="checkmark-done-circle" size={40} color="#16a34a" />
                <Text style={styles.emptyUrgentText}>
                  Great! No requests currently awaiting review.
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
                        <Text style={styles.urgentTypeText}>New Experiment</Text>
                      </View>
                      <Text style={styles.urgentTime}>
                        {exp.status || "Pending"}
                      </Text>
                    </View>
                    <Text style={styles.urgentTitle} numberOfLines={2}>
                      {exp.experimentName}
                    </Text>
                    <View style={styles.urgentMetaRow}>
                      <Text style={styles.urgentAuthor}>
                        Lead: {exp.researcherName || "Researcher"}
                      </Text>
                      <View style={styles.urgentActionBtn}>
                        <Ionicons name="eye-outline" size={14} color="#ffffff" />
                        <Text style={styles.urgentActionText}>Review</Text>
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
                          Allocation Plan
                        </Text>
                      </View>
                      <Text style={styles.urgentTime}>
                        {plan.approveStatus || "Pending"}
                      </Text>
                    </View>
                    <Text style={styles.urgentTitle} numberOfLines={2}>
                      {plan.experimentName || "Resource Allocation Plan"}
                    </Text>
                    <View style={styles.urgentMetaRow}>
                      <Text style={styles.urgentAuthor}>
                        Fitness Score: {plan.fitnessScore != null ? `${plan.fitnessScore}` : "GA Optimized"}
                      </Text>
                      <View style={[styles.urgentActionBtn, { backgroundColor: "#7e22ce" }]}>
                        <Ionicons name="eye-outline" size={14} color="#ffffff" />
                        <Text style={styles.urgentActionText}>Review</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>

          {/* Resource Utilization */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Resource Utilization</Text>
          </View>

          <View style={styles.resourceSummaryCard}>
            {/* Equipment usage */}
            <View style={styles.resourceRow}>
              <View style={styles.resourceRowHeader}>
                <Text style={styles.resourceLabel}>Equipment & Machinery</Text>
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
                <Text style={styles.resourceLabel}>Equipment Under Maintenance</Text>
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
