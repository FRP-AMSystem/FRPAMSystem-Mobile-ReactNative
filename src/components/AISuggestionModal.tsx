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
import { generateAISuggestions, applyAISuggestion } from "../api/aiOptimizationApi";
import { submitExperiment } from "../api/experimentApi";
import { AIOptimizationCandidate } from "../types/aiOptimization";
import { ExperimentItem } from "../types/experiment";
import { styles } from "./AISuggestionModal.styles";

interface AISuggestionModalProps {
  visible: boolean;
  experiment: ExperimentItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

function formatFitnessScore(score?: number | null): string {
  if (score == null) return "--";
  const num = Number(score);
  if (isNaN(num)) return "--";
  const val = num > 1 ? num : num * 100;
  return `${val.toFixed(1).replace(/\.0$/, "")}%`;
}

export function AISuggestionModal({
  visible,
  experiment,
  onClose,
  onSuccess,
}: AISuggestionModalProps) {
  const insets = useSafeAreaInsets();
  const [candidates, setCandidates] = useState<AIOptimizationCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRank, setSelectedRank] = useState(1);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (visible && experiment?.experimentId) {
      loadSuggestions(experiment.experimentId);
    } else {
      setCandidates([]);
      setSelectedRank(1);
    }
  }, [visible, experiment]);

  const loadSuggestions = async (expId: number) => {
    try {
      setLoading(true);
      const data = await generateAISuggestions(expId);
      setCandidates(data || []);
      if (data && data.length > 0) {
        setSelectedRank(data[0].rank);
      }
    } catch (err: any) {
      console.error("Load AI suggestions error:", err);
      Alert.alert(
        "Tối ưu hóa bằng AI",
        err?.message || "Không thể tạo phương án tối ưu. Vui lòng kiểm tra lại các yêu cầu tài nguyên của đề tài."
      );
    } finally {
      setLoading(false);
    }
  };

  const currentCandidate =
    candidates.find((c) => c.rank === selectedRank) || candidates[0];

  const handleApplyAndSubmit = async () => {
    if (!experiment?.experimentId || !currentCandidate) return;

    try {
      setApplying(true);
      // 1. Persist the chosen candidate allocation plan and resources to BE
      await applyAISuggestion(experiment.experimentId, currentCandidate);
      // 2. Submit experiment
      await submitExperiment(experiment.experimentId);

      Alert.alert(
        "Áp dụng thành công",
        `Đã lưu kế hoạch phân bổ tối ưu (Ứng viên #${currentCandidate.rank}) và nộp đề tài lên Quản lý phê duyệt.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Apply suggestion failed:", err);
      Alert.alert("Lỗi", "Không thể nộp đề tài. Vui lòng thử lại.");
    } finally {
      setApplying(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView
        style={[styles.fullContainer, { paddingTop: insets.top > 0 ? insets.top : 8 }]}
        edges={["top", "left", "right"]}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.aiTag}>
                <Ionicons name="sparkles" size={12} color="#7c3aed" />
                <Text style={styles.aiTagText}>AI OPTIMIZATION SOLVER</Text>
              </View>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Gợi ý Phân bổ Tối ưu
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
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={styles.loadingText}>
              Thuật toán di truyền (GA) đang giải bài toán tối ưu hóa tài nguyên từ máy chủ...
            </Text>
          </View>
        ) : candidates.length === 0 ? (
          <View style={styles.centerLoading}>
            <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
            <Text style={[styles.loadingText, { textAlign: "center" }]}>
              Chưa có phương án tối ưu nào được tạo. Đảm bảo đề tài đã có đầy đủ Phase và Yêu cầu thiết bị/nhân sự/đất.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Candidate Selector Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.candidateScroll}
            >
              {candidates.map((c) => {
                const isSel = c.rank === selectedRank;
                return (
                  <TouchableOpacity
                    key={c.rank}
                    style={[styles.candidateTab, isSel && styles.candidateTabActive]}
                    onPress={() => setSelectedRank(c.rank)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.candidateTabRank,
                        isSel && styles.candidateTabRankActive,
                      ]}
                    >
                      {c.rank === 1 ? "★ Ứng viên #1" : `Ứng viên #${c.rank}`}
                    </Text>
                    <Text
                      style={[
                        styles.candidateTabScore,
                        isSel && styles.candidateTabScoreActive,
                      ]}
                    >
                      {formatFitnessScore(c.fitnessScore)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {currentCandidate && (
              <>
                {/* Hero Summary Card */}
                <View style={styles.heroCard}>
                  <View style={styles.heroTopRow}>
                    <View style={styles.scoreBadge}>
                      <Ionicons name="trophy" size={16} color="#15803d" />
                      <Text style={styles.scoreBadgeText}>
                        Độ tối ưu: {formatFitnessScore(currentCandidate.fitnessScore)}
                      </Text>
                    </View>

                    {currentCandidate.conflictCount ? (
                      <View style={styles.conflictBadge}>
                        <Ionicons name="warning" size={13} color="#b91c1c" />
                        <Text style={styles.conflictBadgeText}>
                          {currentCandidate.conflictCount} xung đột
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.conflictBadge,
                          { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
                        ]}
                      >
                        <Ionicons name="checkmark-circle" size={13} color="#16a34a" />
                        <Text style={[styles.conflictBadgeText, { color: "#16a34a" }]}>
                          Khả thi 100%
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.heroTitle}>
                    {experiment?.experimentName || "Phương án điều phối đề tài"}
                  </Text>

                  {/* Metrics grid */}
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {currentCandidate.allocatedEquipment?.length || 0}
                      </Text>
                      <Text style={styles.summaryLabel}>Thiết bị</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {currentCandidate.allocatedHumans?.length || 0}
                      </Text>
                      <Text style={styles.summaryLabel}>Nhân lực</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {currentCandidate.allocatedLands?.length || 0}
                      </Text>
                      <Text style={styles.summaryLabel}>Khu đất</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {currentCandidate.estimatedDurationDays || "-"} ngày
                      </Text>
                      <Text style={styles.summaryLabel}>Thời gian</Text>
                    </View>
                  </View>
                </View>

                {/* Advantages from backend */}
                {currentCandidate.advantages && currentCandidate.advantages.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      <Text style={[styles.sectionTitle, { color: "#166534" }]}>
                        Ưu điểm phương án
                      </Text>
                    </View>
                    {currentCandidate.advantages.map((adv, idx) => (
                      <View key={idx} style={styles.advantageItem}>
                        <Ionicons name="caret-forward" size={14} color="#16a34a" />
                        <Text style={styles.advantageText}>{adv}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Disadvantages / Notices from backend */}
                {currentCandidate.disadvantages && currentCandidate.disadvantages.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="alert-circle" size={18} color="#dc2626" />
                      <Text style={[styles.sectionTitle, { color: "#991b1b" }]}>
                        Lưu ý & Ràng buộc
                      </Text>
                    </View>
                    {currentCandidate.disadvantages.map((dis, idx) => (
                      <View key={idx} style={styles.disadvantageItem}>
                        <Ionicons name="ellipse" size={8} color="#dc2626" style={{ marginTop: 5 }} />
                        <Text style={styles.disadvantageText}>{dis}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Equipment Allocation */}
                {currentCandidate.allocatedEquipment && currentCandidate.allocatedEquipment.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="construct" size={18} color="#d97706" />
                      <Text style={styles.sectionTitle}>Thiết bị được điều phối</Text>
                    </View>
                    {currentCandidate.allocatedEquipment.map((eq, idx) => (
                      <View key={idx} style={styles.resourceRowCard}>
                        <Text style={styles.resourceTitle}>
                          {eq.equipmentTypeName || "Thiết bị chuyên dụng"}
                        </Text>
                        <Text style={styles.resourceSub}>
                          Mã máy: {eq.assetCode || "Tự động gán"} • Hiệu suất:{" "}
                          {Math.round((eq.efficiencyRate || 1) * 100)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Personnel Allocation */}
                {currentCandidate.allocatedHumans && currentCandidate.allocatedHumans.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="people" size={18} color="#9333ea" />
                      <Text style={styles.sectionTitle}>Nhân sự được bố trí</Text>
                    </View>
                    {currentCandidate.allocatedHumans.map((hu, idx) => (
                      <View key={idx} style={styles.resourceRowCard}>
                        <Text style={styles.resourceTitle}>
                          {hu.fullName || hu.roleName || "Cán bộ tác nghiệp"}
                        </Text>
                        <Text style={styles.resourceSub}>
                          Vai trò: {hu.roleName || "Kỹ thuật"} {hu.skillName ? `• Kỹ năng: ${hu.skillName}` : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}

        {/* Sticky Action Footer */}
        {currentCandidate && (
          <View
            style={[
              styles.footerActionBar,
              { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 14 },
            ]}
          >
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApplyAndSubmit}
              disabled={applying}
              activeOpacity={0.8}
            >
              {applying ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={18} color="#ffffff" />
                  <Text style={styles.applyBtnText}>
                    Áp dụng Ứng viên #{currentCandidate.rank} & Nộp duyệt
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
