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
  return `${val.toFixed(1).replace(/\.0$/, "")}`;
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
        "AI Optimization",
        err?.message || "Could not generate optimization plan. Please verify all resource requirements."
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
        "Applied Successfully",
        `Saved optimal allocation plan (Candidate #${currentCandidate.rank}) and submitted experiment for Manager approval.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Apply suggestion failed:", err);
      Alert.alert("Error", "Failed to submit experiment. Please try again.");
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
                Optimal Allocation Suggestions
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
              Genetic Algorithm (GA) solver is computing optimal resource allocations...
            </Text>
          </View>
        ) : candidates.length === 0 ? (
          <View style={styles.centerLoading}>
            <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
            <Text style={[styles.loadingText, { textAlign: "center" }]}>
              No optimization candidates found. Please ensure the experiment has phases and equipment/personnel/land requirements configured.
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
                      {c.rank === 1 ? "★ Candidate #1" : `Candidate #${c.rank}`}
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
                        Fitness Score: {formatFitnessScore(currentCandidate.fitnessScore)}
                      </Text>
                    </View>

                    {currentCandidate.conflictCount ? (
                      <View style={styles.conflictBadge}>
                        <Ionicons name="warning" size={13} color="#b91c1c" />
                        <Text style={styles.conflictBadgeText}>
                          {currentCandidate.conflictCount} conflicts
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
                          100% Feasible
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.heroTitle}>
                    {experiment?.experimentName || "Experiment Allocation Plan"}
                  </Text>

                  {/* Metrics grid */}
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {currentCandidate.allocatedEquipment?.length || 0}
                      </Text>
                      <Text style={styles.summaryLabel}>Equipment</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {currentCandidate.allocatedHumans?.length || 0}
                      </Text>
                      <Text style={styles.summaryLabel}>Personnel</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {currentCandidate.allocatedLands?.length || 0}
                      </Text>
                      <Text style={styles.summaryLabel}>Land</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {currentCandidate.estimatedDurationDays || "-"} days
                      </Text>
                      <Text style={styles.summaryLabel}>Duration</Text>
                    </View>
                  </View>
                </View>

                {/* Advantages from backend */}
                {currentCandidate.advantages && currentCandidate.advantages.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      <Text style={[styles.sectionTitle, { color: "#166534" }]}>
                        Candidate Advantages
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
                        Constraints & Notices
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
                      <Text style={styles.sectionTitle}>Allocated Equipment</Text>
                    </View>
                    {currentCandidate.allocatedEquipment.map((eq, idx) => (
                      <View key={idx} style={styles.resourceRowCard}>
                        <Text style={styles.resourceTitle}>
                          {eq.equipmentTypeName || "Specialized Equipment"}
                        </Text>
                        <Text style={styles.resourceSub}>
                          Asset Code: {eq.assetCode || "Auto-assigned"} • Efficiency:{" "}
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
                      <Text style={styles.sectionTitle}>Allocated Personnel</Text>
                    </View>
                    {currentCandidate.allocatedHumans.map((hu, idx) => (
                      <View key={idx} style={styles.resourceRowCard}>
                        <Text style={styles.resourceTitle}>
                          {hu.fullName || hu.roleName || "Field Staff"}
                        </Text>
                        <Text style={styles.resourceSub}>
                          Role: {hu.roleName || "Technical"} {hu.skillName ? `• Skill: ${hu.skillName}` : ""}
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
                    Apply Candidate #{currentCandidate.rank} & Submit
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
