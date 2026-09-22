import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  AllocationPlanItem,
  AllocatedEquipmentItem,
  AllocatedHumanItem,
  AllocatedLandItem,
  AllocationPlanStatus,
} from "../types/allocationPlan";
import {
  getAllocationPlanEquipment,
  getAllocationPlanHuman,
  getAllocationPlanLand,
  approveAllocationPlan,
  rejectAllocationPlan,
} from "../api/allocationPlanApi";
import { RejectReasonModal } from "./RejectReasonModal";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../constants/colors";
import { styles } from "./AllocationPlanDetailModal.styles";

interface AllocationPlanDetailModalProps {
  visible: boolean;
  plan: AllocationPlanItem | null;
  loading?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function formatFitnessScore(score?: number | null): string {
  if (score == null) return "--";
  const num = Number(score);
  if (isNaN(num)) return "--";
  const val = num > 1 ? num : num * 100;
  return `${val.toFixed(1).replace(/\.0$/, "")}`;
}

export function AllocationPlanDetailModal({
  visible,
  plan,
  loading = false,
  onClose,
  onSuccess,
}: AllocationPlanDetailModalProps) {
  const { isManager, isAdmin } = useAuth();
  const [equipment, setEquipment] = useState<AllocatedEquipmentItem[]>([]);
  const [human, setHuman] = useState<AllocatedHumanItem[]>([]);
  const [land, setLand] = useState<AllocatedLandItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  useEffect(() => {
    if (visible && plan?.allocationPlanId) {
      loadDetails(plan.allocationPlanId);
    } else {
      setEquipment([]);
      setHuman([]);
      setLand([]);
    }
  }, [visible, plan]);

  const handleApprove = () => {
    if (!plan) return;
    Alert.alert(
      "Approve Allocation Plan",
      `Are you sure you want to approve the resource allocation plan for "${plan.experimentName || ""}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              setActionLoading(true);
              await approveAllocationPlan(plan.allocationPlanId);
              Alert.alert("Success", "Allocation plan has been approved!");
              onSuccess?.();
              onClose();
            } catch (err: any) {
              console.error(err);
              Alert.alert("Error", "Failed to approve allocation plan.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!plan) return;
    try {
      setActionLoading(true);
      await rejectAllocationPlan(plan.allocationPlanId, reason);
      setRejectModalVisible(false);
      Alert.alert("Success", "Allocation plan rejected and feedback sent.");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", "Failed to reject allocation plan.");
    } finally {
      setActionLoading(false);
    }
  };

  const loadDetails = async (id: number) => {
    try {
      setLoadingDetails(true);
      const [eqData, huData, landData] = await Promise.all([
        getAllocationPlanEquipment(id).catch(() => []),
        getAllocationPlanHuman(id).catch(() => []),
        getAllocationPlanLand(id).catch(() => []),
      ]);
      setEquipment(eqData || []);
      setHuman(huData || []);
      setLand(landData || []);
    } catch (err) {
      console.error("Load allocation details error:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (!visible) return null;

  const getStatusBadge = (status?: AllocationPlanStatus) => {
    switch (status) {
      case "Approved":
        return {
          label: "Approved",
          bg: "#f0fdf4",
          text: "#15803d",
          border: "#86efac",
          icon: "checkmark-circle" as const,
        };
      case "Pending":
        return {
          label: "Pending",
          bg: "#fffbeb",
          text: "#b45309",
          border: "#fde68a",
          icon: "time" as const,
        };
      case "Rejected":
        return {
          label: "Rejected",
          bg: "#fef2f2",
          text: "#b91c1c",
          border: "#fca5a5",
          icon: "close-circle" as const,
        };
      case "Draft":
      default:
        return {
          label: "Draft",
          bg: "#f1f5f9",
          text: "#475569",
          border: "#cbd5e1",
          icon: "document-text" as const,
        };
    }
  };

  const statusBadge = getStatusBadge(plan?.approveStatus);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.categoryPill}>
                  <Ionicons name="git-network" size={13} color="#7e22ce" />
                  <Text style={styles.categoryPillText}>RESOURCE ALLOCATION</Text>
                </View>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  Allocation Plan Details
                </Text>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body Content */}
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading allocation plan...</Text>
            </View>
          ) : !plan ? (
            <View style={styles.centerLoading}>
              <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Allocation plan not found.</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Hero Card */}
              <View style={styles.heroCard}>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
                    ]}
                  >
                    <Ionicons
                      name={statusBadge.icon}
                      size={12}
                      color={statusBadge.text}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.badgeText, { color: statusBadge.text }]}>
                      {statusBadge.label}
                    </Text>
                  </View>

                  {plan.fitnessScore != null ? (
                    <View style={styles.fitnessPill}>
                      <Text style={styles.fitnessText}>
                        Fitness Score: {formatFitnessScore(plan.fitnessScore)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.planTitle}>
                  {plan.experimentName || "Experiment Resource Allocation Plan"}
                </Text>
              </View>

              {/* 2. Equipment */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={[styles.sectionIconBox, { backgroundColor: "#fffbeb" }]}>
                      <Ionicons name="construct" size={16} color="#d97706" />
                    </View>
                    <Text style={styles.sectionTitle}>Allocated Equipment</Text>
                  </View>
                  <View style={styles.itemCountBadge}>
                    <Text style={styles.itemCountText}>{equipment.length} units</Text>
                  </View>
                </View>

                {loadingDetails ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : equipment.length === 0 ? (
                  <Text style={styles.emptyText}>No equipment allocated in this plan.</Text>
                ) : (
                  equipment.map((eq, idx) => (
                    <View key={eq.allocationEquipmentDetailId || idx} style={styles.detailRowCard}>
                      <View style={styles.detailRowHeader}>
                        <Text style={styles.detailRowTitle}>
                          {eq.allocatedEquipmentTypeName || "Specialized Equipment"}
                        </Text>
                        <View style={styles.statusSubBadge}>
                          <Text style={styles.statusSubText}>{eq.status || "Allocated"}</Text>
                        </View>
                      </View>
                      {eq.assetCode ? (
                        <Text style={styles.detailRowSub}>Asset Code: {eq.assetCode}</Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>

              {/* 3. Personnel */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={[styles.sectionIconBox, { backgroundColor: "#faf5ff" }]}>
                      <Ionicons name="people" size={16} color="#9333ea" />
                    </View>
                    <Text style={styles.sectionTitle}>Allocated Personnel</Text>
                  </View>
                  <View style={styles.itemCountBadge}>
                    <Text style={styles.itemCountText}>{human.length} staff</Text>
                  </View>
                </View>

                {loadingDetails ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : human.length === 0 ? (
                  <Text style={styles.emptyText}>No personnel allocated in this plan.</Text>
                ) : (
                  human.map((hu, idx) => (
                    <View key={hu.allocationHumanDetailId || idx} style={styles.detailRowCard}>
                      <View style={styles.detailRowHeader}>
                        <Text style={styles.detailRowTitle}>
                          {hu.humanResourceName || "Field Staff"}
                        </Text>
                        <View style={styles.statusSubBadge}>
                          <Text style={styles.statusSubText}>{hu.status || "Ready"}</Text>
                        </View>
                      </View>
                      {hu.workingHours ? (
                        <Text style={styles.detailRowSub}>Workload: {hu.workingHours} work hours</Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>

              {/* 4. Land */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <View style={[styles.sectionIconBox, { backgroundColor: "#f0fdf4" }]}>
                      <Ionicons name="leaf" size={16} color="#16a34a" />
                    </View>
                    <Text style={styles.sectionTitle}>Allocated Land Plots</Text>
                  </View>
                  <View style={styles.itemCountBadge}>
                    <Text style={styles.itemCountText}>{land.length} plots</Text>
                  </View>
                </View>

                {loadingDetails ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : land.length === 0 ? (
                  <Text style={styles.emptyText}>No land plots allocated in this plan.</Text>
                ) : (
                  land.map((ld, idx) => (
                    <View key={ld.allocationLandDetailId || idx} style={styles.detailRowCard}>
                      <View style={styles.detailRowHeader}>
                        <Text style={styles.detailRowTitle}>
                          {ld.landName || "Forestry Plot"}
                        </Text>
                        <View style={styles.statusSubBadge}>
                          <Text style={styles.statusSubText}>{ld.status || "Allocated"}</Text>
                        </View>
                      </View>
                      {ld.areaName ? (
                        <Text style={styles.detailRowSub}>Area: {ld.areaName}</Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          )}

          {/* Action Footer */}
          <View style={styles.footerBar}>
            {/* Manager / Admin Approval Actions */}
            {(isManager || isAdmin) && plan && plan.approveStatus !== "Approved" && (
              <View style={styles.managerActionBar}>
                <TouchableOpacity
                  style={[styles.approveBtn, actionLoading && { opacity: 0.6 }]}
                  onPress={handleApprove}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                  <Text style={styles.approveBtnText}>Approve Allocation</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rejectBtn, actionLoading && { opacity: 0.6 }]}
                  onPress={() => setRejectModalVisible(true)}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={18} color="#ffffff" />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeActionText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reject Reason Modal */}
        <RejectReasonModal
          visible={rejectModalVisible}
          title="Reject Allocation Plan"
          itemTitle={plan?.experimentName || undefined}
          itemType="allocation plan"
          loading={actionLoading}
          onClose={() => setRejectModalVisible(false)}
          onConfirm={handleRejectConfirm}
        />
      </View>
    </Modal>
  );
}
