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
      "Phê duyệt đề tài",
      `Bạn có chắc chắn muốn phê duyệt đề tài "${experiment.experimentName}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Phê duyệt",
          onPress: async () => {
            try {
              setActionLoading(true);
              await approveExperiment(experiment.experimentId);
              Alert.alert("Thành công", "Đề tài đã được phê duyệt chính thức!");
              onSuccess();
              onClose();
            } catch (err: any) {
              console.error(err);
              Alert.alert("Lỗi", "Không thể phê duyệt đề tài.");
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
      Alert.alert("Thành công", "Đã từ chối đề tài và gửi phản hồi lý do.");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể từ chối đề tài.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!experiment) return;

    Alert.alert(
      "Xác nhận nộp đề tài",
      `Bạn có chắc chắn muốn nộp đề tài "${experiment.experimentName}" lên Quản lý phê duyệt không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Nộp đề tài",
          onPress: async () => {
            try {
              setSubmitting(true);
              await submitExperiment(experiment.experimentId);
              Alert.alert(
                "Thành công",
                "Đề tài đã được nộp phê duyệt. Quản lý sẽ sớm thẩm định kế hoạch của bạn."
              );
              onSuccess();
              onClose();
            } catch (err: any) {
              console.error(err);
              Alert.alert("Lỗi", "Không thể nộp đề tài phê duyệt.");
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
      case "Created":
      default:
        return { label: "Bản nháp", bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
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
                <Text style={styles.categoryPillText}>ĐỀ TÀI KHẢO NGHIỆM</Text>
              </View>
              <Text style={styles.modalTitle} numberOfLines={1}>
                Chi tiết Đề tài Nghiên cứu
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Sub-Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {[
              { key: "overview", label: "Tổng quan & Phase" },
              { key: "equipment", label: `Thiết bị (${equipmentReqs.length})` },
              { key: "human", label: `Nhân sự (${humanReqs.length})` },
              { key: "land", label: `Khu đất (${landReqs.length})` },
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
            <Text style={styles.loadingText}>Đang tải chi tiết đề tài...</Text>
          </View>
        ) : !experiment ? (
          <View style={styles.centerLoading}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Không tìm thấy thông tin đề tài này.</Text>
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
                          Ưu tiên:{" "}
                          {experiment.priority === "3"
                            ? "Khẩn cấp"
                            : experiment.priority === "2"
                            ? "Cao"
                            : experiment.priority === "1"
                            ? "Trung bình"
                            : "Thấp"}
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
                        Thời gian: {formatDate(experiment.expectStartDate)} -{" "}
                        {formatDate(experiment.expectEndDate)}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="alarm-outline" size={15} color="#d97706" />
                      <Text style={styles.infoText}>Hạn chót: {formatDate(experiment.deadline)}</Text>
                    </View>

                    {experiment.researcherName ? (
                      <View style={styles.infoRow}>
                        <Ionicons name="person-circle-outline" size={15} color="#9333ea" />
                        <Text style={styles.infoText}>Chủ nhiệm: {experiment.researcherName}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Phases Section */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                      <Ionicons name="layers" size={18} color={Colors.primary} />
                      <Text style={styles.sectionTitle}>Các Giai đoạn Khảo nghiệm</Text>
                    </View>
                    <View style={styles.itemCountBadge}>
                      <Text style={styles.itemCountText}>{phases.length} Phase</Text>
                    </View>
                  </View>

                  {phases.length === 0 ? (
                    <Text style={styles.emptyText}>Chưa có giai đoạn nào được tạo.</Text>
                  ) : (
                    phases.map((phase, idx) => (
                      <View key={phase.experimentPhaseId || idx} style={styles.phaseCard}>
                        <View style={styles.phaseCardTop}>
                          <View style={styles.phaseOrderPill}>
                            <Text style={styles.phaseOrderText}>Giai đoạn #{idx + 1}</Text>
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
                    <Text style={styles.sectionTitle}>Yêu cầu Thiết bị & Máy móc</Text>
                  </View>
                  <View style={styles.itemCountBadge}>
                    <Text style={styles.itemCountText}>{equipmentReqs.length} yêu cầu</Text>
                  </View>
                </View>

                {equipmentReqs.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có yêu cầu thiết bị nào.</Text>
                ) : (
                  equipmentReqs.map((eq, idx) => (
                    <View key={eq.expEquipmentReqId || idx} style={styles.resourceItemCard}>
                      <View style={styles.resourceItemHeader}>
                        <Text style={styles.resourceItemTitle}>
                          {eq.equipmentTypeName || "Thiết bị chuyên dụng"}
                        </Text>
                        <View style={styles.resourceQtyBadge}>
                          <Text style={styles.resourceQtyText}>{eq.quantity} chiếc</Text>
                        </View>
                      </View>
                      <Text style={styles.resourceItemSub}>
                        Hiệu suất tối thiểu:{" "}
                        {eq.minAcceptableEfficiency != null
                          ? `${Math.round(
                              eq.minAcceptableEfficiency > 1
                                ? eq.minAcceptableEfficiency
                                : eq.minAcceptableEfficiency * 100
                            )}%`
                          : "Không quy định"}{" "}
                        • Thay thế: {eq.allowSubstitute ? "Cho phép" : "Không cho phép"}
                      </Text>
                      {eq.note ? (
                        <Text style={[styles.resourceItemSub, { fontStyle: "italic", marginTop: 4 }]}>
                          Ghi chú: {eq.note}
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
                    <Text style={styles.sectionTitle}>Yêu cầu Nhân sự & Kỹ năng</Text>
                  </View>
                  <View style={styles.itemCountBadge}>
                    <Text style={styles.itemCountText}>{humanReqs.length} yêu cầu</Text>
                  </View>
                </View>

                {humanReqs.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có yêu cầu nhân sự nào.</Text>
                ) : (
                  humanReqs.map((hu, idx) => (
                    <View key={hu.expHumanReqId || idx} style={styles.resourceItemCard}>
                      <View style={styles.resourceItemHeader}>
                        <Text style={styles.resourceItemTitle}>
                          {hu.roleName === "Technician" ? "Kỹ thuật viên" : "Nhân sự Thời vụ"}
                        </Text>
                        <View style={[styles.resourceQtyBadge, { backgroundColor: "#faf5ff" }]}>
                          <Text style={[styles.resourceQtyText, { color: "#7e22ce" }]}>
                            {hu.quantity} nhân sự
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.resourceItemSub}>
                        Kỹ năng: {hu.requiredSkillName || "Bất kỳ"} • Khối lượng:{" "}
                        {hu.workingHoursPerDay || 8}h/ngày
                      </Text>
                      {hu.note ? (
                        <Text style={[styles.resourceItemSub, { fontStyle: "italic", marginTop: 4 }]}>
                          Nhiệm vụ: {hu.note}
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
                    <Text style={styles.sectionTitle}>Yêu cầu Đất Khảo nghiệm</Text>
                  </View>
                  <View style={styles.itemCountBadge}>
                    <Text style={styles.itemCountText}>{landReqs.length} khu đất</Text>
                  </View>
                </View>

                {landReqs.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có yêu cầu khu đất nào.</Text>
                ) : (
                  landReqs.map((land, idx) => (
                    <View key={land.expLandReqId || idx} style={styles.resourceItemCard}>
                      <View style={styles.resourceItemHeader}>
                        <Text style={styles.resourceItemTitle}>
                          Diện tích: {land.requiredArea.toLocaleString()} m²
                        </Text>
                        <View style={[styles.resourceQtyBadge, { backgroundColor: "#f0fdf4" }]}>
                          <Text style={[styles.resourceQtyText, { color: "#15803d" }]}>
                            {land.requiredSoilType || "Tùy chọn"}
                          </Text>
                        </View>
                      </View>
                      {land.note ? (
                        <Text style={[styles.resourceItemSub, { fontStyle: "italic", marginTop: 4 }]}>
                          Yêu cầu vị trí: {land.note}
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
                  <Text style={styles.approveBtnText}>Phê duyệt Đề tài</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rejectBtn, actionLoading && { opacity: 0.6 }]}
                  onPress={() => setRejectModalVisible(true)}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={18} color="#ffffff" />
                  <Text style={styles.rejectBtnText}>Từ chối</Text>
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
                    <Text style={styles.submitActionBtnText}>Nộp Đề tài Phê duyệt</Text>
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
              <Text style={styles.aiActionBtnText}>Tối ưu hóa Phân bổ bằng AI (GA Solver)</Text>
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
          title="Từ chối Đề tài Khảo nghiệm"
          itemTitle={experiment?.experimentName || undefined}
          itemType="đề tài"
          loading={actionLoading}
          onClose={() => setRejectModalVisible(false)}
          onConfirm={handleRejectConfirm}
        />
      </SafeAreaView>
    </Modal>
  );
}
