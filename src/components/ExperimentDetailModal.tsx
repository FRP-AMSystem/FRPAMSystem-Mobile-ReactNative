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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  ExperimentItem,
  ExperimentStatus,
  ExperimentPhaseItem,
  ExperimentEquipmentRequirementItem,
  ExperimentHumanRequirementItem,
  ExperimentLandRequirementItem,
} from "../types/experiment";
import { submitExperiment, approveExperiment, rejectExperiment } from "../api/experimentApi";
import { getExperimentPhases } from "../api/experimentPhaseApi";
import {
  getExperimentEquipmentRequirements,
  getExperimentHumanRequirements,
  getExperimentLandRequirements,
} from "../api/experimentRequirementApi";
import { AISuggestionModal } from "./AISuggestionModal";
import { RejectReasonModal } from "./RejectReasonModal";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../constants/colors";
import { styles } from "./ExperimentDetailModal.styles";

interface ExperimentDetailModalProps {
  visible: boolean;
  experiment: ExperimentItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

type DetailTab = "overview" | "equipment" | "human" | "land";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function ExperimentDetailModal({
  visible,
  experiment,
  onClose,
  onSuccess,
}: ExperimentDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { isManager, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [phases, setPhases] = useState<ExperimentPhaseItem[]>([]);
  const [equipmentReqs, setEquipmentReqs] = useState<ExperimentEquipmentRequirementItem[]>([]);
  const [humanReqs, setHumanReqs] = useState<ExperimentHumanRequirementItem[]>([]);
  const [landReqs, setLandReqs] = useState<ExperimentLandRequirementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  // AI Modal
  const [aiModalVisible, setAiModalVisible] = useState(false);

  useEffect(() => {
    if (visible && experiment?.experimentId) {
      loadAllDetails(experiment.experimentId);
    } else {
      setPhases([]);
      setEquipmentReqs([]);
      setHumanReqs([]);
      setLandReqs([]);
      setActiveTab("overview");
    }
  }, [visible, experiment]);

  const loadAllDetails = async (id: number) => {
    try {
      setLoading(true);
      const [phaseData, eqData, huData, landData] = await Promise.all([
        getExperimentPhases(id).catch(() => []),
        getExperimentEquipmentRequirements(id).catch(() => []),
        getExperimentHumanRequirements(id).catch(() => []),
        getExperimentLandRequirements(id).catch(() => []),
      ]);
      setPhases(phaseData || []);
      setEquipmentReqs(eqData || []);
      setHumanReqs(huData || []);
      setLandReqs(landData || []);
    } catch (err) {
      console.error("Load experiment details error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const handleApprove = () => {
    if (!experiment) return;

    Alert.alert(
      "Approve Experiment",
      `Are you sure you want to approve experiment "${experiment.experimentName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              setActionLoading(true);
              await approveExperiment(experiment.experimentId);
              Alert.alert("Success", "Experiment has been officially approved!");
              onSuccess();
              onClose();
            } catch (err: any) {
              console.error(err);
              Alert.alert("Error", "Failed to approve experiment.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!experiment) return;
    try {
      setActionLoading(true);
      await rejectExperiment(experiment.experimentId, reason);
      setRejectModalVisible(false);
      Alert.alert("Success", "Experiment rejected and feedback sent.");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", "Failed to reject experiment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!experiment) return;

    Alert.alert(
      "Submit Experiment",
      `Are you sure you want to submit "${experiment.experimentName}" for Manager approval?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            try {
              setSubmitting(true);
              await submitExperiment(experiment.experimentId);
              Alert.alert(
                "Success",
                "Experiment submitted for approval. The Manager will review your plan shortly."
              );
              onSuccess();
              onClose();
            } catch (err: any) {
              console.error(err);
              Alert.alert("Error", "Failed to submit experiment for approval.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status?: ExperimentStatus) => {
    switch (status) {
      case "Running":
        return { label: "Running", bg: "#f0fdf4", text: "#15803d", border: "#86efac" };
      case "Approved":
        return { label: "Approved", bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" };
      case "Pending":
        return { label: "Pending", bg: "#fffbeb", text: "#b45309", border: "#fde68a" };
      case "Completed":
        return { label: "Completed", bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" };
      case "Rejected":
        return { label: "Rejected", bg: "#fef2f2", text: "#b91c1c", border: "#fca5a5" };
      case "Draft":
      case "Created":
      default:
        return { label: "Draft", bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
    }
  };

  const badge = getStatusBadge(experiment?.status);
  const isDraft = experiment?.status === "Draft" || experiment?.status === "Created";

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView
        style={[styles.fullContainer, { paddingTop: insets.top > 0 ? insets.top : 8 }]}
        edges={["top", "left", "right"]}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.categoryPill}>
                <Ionicons name="flask" size={12} color="#166534" />
                <Text style={styles.categoryPillText}>EXPERIMENT TRIAL</Text>
              </View>
              <Text style={styles.modalTitle} numberOfLines={1}>
                Experiment Details
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Sub-Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {[
              { key: "overview", label: "Overview & Phases" },
              { key: "equipment", label: `Equipment (${equipmentReqs.length})` },
              { key: "human", label: `Personnel (${humanReqs.length})` },
              { key: "land", label: `Land (${landReqs.length})` },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab.key as DetailTab)}
                >
                  <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Body Content */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading experiment details...</Text>
          </View>
        ) : !experiment ? (
          <View style={styles.centerLoading}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No information found for this experiment.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* TAB 1: OVERVIEW & PHASES */}
            {activeTab === "overview" && (
              <>
                {/* Hero Card */}
                <View style={styles.heroCard}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>

                    {experiment.priority != null ? (
                      <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>
                          Priority:{" "}
                          {experiment.priority === "3"
                            ? "Urgent"
                            : experiment.priority === "2"
                            ? "High"
                            : experiment.priority === "1"
                            ? "Medium"
                            : "Low"}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.expTitle}>{experiment.experimentName}</Text>

                  {experiment.description ? (
                    <Text style={styles.expDesc}>{experiment.description}</Text>
                  ) : null}

                  {/* Info grid */}
                  <View style={styles.infoGrid}>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={15} color={Colors.primary} />
                      <Text style={styles.infoText}>
                        Timeline: {formatDate(experiment.expectStartDate)} -{" "}
                        {formatDate(experiment.expectEndDate)}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="alarm-outline" size={15} color="#d97706" />
                      <Text style={styles.infoText}>Deadline: {formatDate(experiment.deadline)}</Text>
                    </View>

                    {experiment.researcherName ? (
                      <View style={styles.infoRow}>
                        <Ionicons name="person-circle-outline" size={15} color="#9333ea" />
                        <Text style={styles.infoText}>Lead Researcher: {experiment.researcherName}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Phases Section */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <Ionicons name="layers" size={18} color={Colors.primary} />
                      <Text style={styles.sectionTitle}>Experiment Phases</Text>
                    </View>
                    <View style={styles.itemCountBadge}>
                      <Text style={styles.itemCountText}>{phases.length} Phases</Text>
                    </View>
                  </View>

                  {phases.length === 0 ? (
                    <Text style={styles.emptyText}>No phases created yet.</Text>
                  ) : (
                    phases.map((phase, idx) => (
                      <View key={phase.experimentPhaseId || idx} style={styles.phaseCard}>
                        <View style={styles.phaseCardTop}>
                          <View style={styles.phaseOrderPill}>
                            <Text style={styles.phaseOrderText}>Phase #{idx + 1}</Text>
                          </View>
                          <Text style={styles.phaseDates}>
                            {formatDate(phase.expectedStartDate)} - {formatDate(phase.expectedEndDate)}
                          </Text>
                        </View>
                        <Text style={styles.phaseName}>{phase.phaseName}</Text>
                        {phase.phaseDescription ? (
                          <Text style={styles.phaseDesc}>{phase.phaseDescription}</Text>
                        ) : null}
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            {/* TAB 2: EQUIPMENT REQUIREMENTS */}
            {activeTab === "equipment" && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="construct" size={18} color="#d97706" />
                    <Text style={styles.sectionTitle}>Equipment & Machinery Requirements</Text>
                  </View>
                  <View style={styles.itemCountBadge}>
                    <Text style={styles.itemCountText}>{equipmentReqs.length} reqs</Text>
                  </View>
                </View>

                {equipmentReqs.length === 0 ? (
                  <Text style={styles.emptyText}>No equipment requirements added.</Text>
                ) : (
                  equipmentReqs.map((eq, idx) => (
                    <View key={eq.expEquipmentReqId || idx} style={styles.resourceItemCard}>
                      <View style={styles.resourceItemHeader}>
                        <Text style={styles.resourceItemTitle}>
                          {eq.equipmentTypeName || "Specialized Equipment"}
                        </Text>
                        <View style={styles.resourceQtyBadge}>
                          <Text style={styles.resourceQtyText}>{eq.quantity} units</Text>
                        </View>
                      </View>
                      <Text style={styles.resourceItemSub}>
                        Min Efficiency:{" "}
                        {eq.minAcceptableEfficiency != null
                          ? `${Math.round(
                              eq.minAcceptableEfficiency > 1
                                ? eq.minAcceptableEfficiency
                                : eq.minAcceptableEfficiency * 100
                            )}%`
                          : "Unspecified"}{" "}
                        • Substitute: {eq.allowSubstitute ? "Allowed" : "Not Allowed"}
                      </Text>
                      {eq.note ? (
                        <Text style={[styles.resourceItemSub, { fontStyle: "italic", marginTop: 4 }]}>
                          Note: {eq.note}
                        </Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 3: HUMAN REQUIREMENTS */}
            {activeTab === "human" && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="people" size={18} color="#9333ea" />
                    <Text style={styles.sectionTitle}>Personnel & Skills Requirements</Text>
                  </View>
                  <View style={styles.itemCountBadge}>
                    <Text style={styles.itemCountText}>{humanReqs.length} reqs</Text>
                  </View>
                </View>

                {humanReqs.length === 0 ? (
                  <Text style={styles.emptyText}>No personnel requirements added.</Text>
                ) : (
                  humanReqs.map((hu, idx) => (
                    <View key={hu.expHumanReqId || idx} style={styles.resourceItemCard}>
                      <View style={styles.resourceItemHeader}>
                        <Text style={styles.resourceItemTitle}>
                          {hu.roleName === "Technician" ? "Technician" : "Seasonal Worker"}
                        </Text>
                        <View style={[styles.resourceQtyBadge, { backgroundColor: "#faf5ff" }]}>
                          <Text style={[styles.resourceQtyText, { color: "#7e22ce" }]}>
                            {hu.quantity} staff
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.resourceItemSub}>
                        Skill: {hu.requiredSkillName || "Any"} • Workload:{" "}
                        {hu.workingHoursPerDay || 8}h/day
                      </Text>
                      {hu.note ? (
                        <Text style={[styles.resourceItemSub, { fontStyle: "italic", marginTop: 4 }]}>
                          Task note: {hu.note}
                        </Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 4: LAND REQUIREMENTS */}
            {activeTab === "land" && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="leaf" size={18} color="#16a34a" />
                    <Text style={styles.sectionTitle}>Land Plot Requirements</Text>
                  </View>
                  <View style={styles.itemCountBadge}>
                    <Text style={styles.itemCountText}>{landReqs.length} plots</Text>
                  </View>
                </View>

                {landReqs.length === 0 ? (
                  <Text style={styles.emptyText}>No land plot requirements added.</Text>
                ) : (
                  landReqs.map((land, idx) => (
                    <View key={land.expLandReqId || idx} style={styles.resourceItemCard}>
                      <View style={styles.resourceItemHeader}>
                        <Text style={styles.resourceItemTitle}>
                          Area: {land.requiredArea.toLocaleString()} m²
                        </Text>
                        <View style={[styles.resourceQtyBadge, { backgroundColor: "#f0fdf4" }]}>
                          <Text style={[styles.resourceQtyText, { color: "#15803d" }]}>
                            {land.requiredSoilType || "Any soil type"}
                          </Text>
                        </View>
                      </View>
                      {land.note ? (
                        <Text style={[styles.resourceItemSub, { fontStyle: "italic", marginTop: 4 }]}>
                          Location requirements: {land.note}
                        </Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* Sticky Action Footer */}
        {experiment && (
          <View
            style={[
              styles.footerActionBar,
              { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 14 },
            ]}
          >
            {/* Manager / Admin Approval Actions */}
            {(isManager || isAdmin) && experiment.status !== "Approved" && (
              <View style={styles.managerActionBar}>
                <TouchableOpacity
                  style={[styles.approveBtn, actionLoading && { opacity: 0.6 }]}
                  onPress={handleApprove}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                  <Text style={styles.approveBtnText}>Approve Experiment</Text>
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

            {/* Researcher Submit Button (for draft experiments) */}
            {isDraft && !isManager && !isAdmin ? (
              <TouchableOpacity
                style={styles.submitActionBtn}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={18} color="#ffffff" />
                    <Text style={styles.submitActionBtnText}>Submit for Approval</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}

            {/* AI Optimization Action Button */}
            <TouchableOpacity
              style={styles.aiActionBtn}
              onPress={() => setAiModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={18} color="#ffffff" />
              <Text style={styles.aiActionBtnText}>AI Allocation Optimizer (GA Solver)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AI Solver Modal */}
        <AISuggestionModal
          visible={aiModalVisible}
          experiment={experiment}
          onClose={() => setAiModalVisible(false)}
          onSuccess={() => {
            onSuccess();
            if (experiment?.experimentId) {
              loadAllDetails(experiment.experimentId);
            }
          }}
        />

        {/* Reject Reason Modal */}
        <RejectReasonModal
          visible={rejectModalVisible}
          title="Reject Research Experiment"
          itemTitle={experiment?.experimentName || undefined}
          itemType="experiment"
          loading={actionLoading}
          onClose={() => setRejectModalVisible(false)}
          onConfirm={handleRejectConfirm}
        />
      </SafeAreaView>
    </Modal>
  );
}
