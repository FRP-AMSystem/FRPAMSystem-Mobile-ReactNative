import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import {
  getMyAllocationEquipment,
  handoverEquipment,
  returnEquipment,
} from "../../api/equipmentApi";
import { AllocationEquipmentDetail } from "../../types/equipment";
import { Colors } from "../../constants/colors";
import { styles } from "../../styles/equipment.styles";

type TabFilter = "all" | "inuse" | "allocated" | "completed";

export default function EquipmentScreen() {
  const { user, role } = useAuth();
  const [items, setItems] = useState<AllocationEquipmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabFilter, setTabFilter] = useState<TabFilter>("all");

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [returnItem, setReturnItem] = useState<AllocationEquipmentDetail | null>(null);
  const [returnCondition, setReturnCondition] = useState<string>("Good");
  const [returnNotes, setReturnNotes] = useState("");

  const loadData = useCallback(async () => {
    try {
      const data = await getMyAllocationEquipment();
      setItems(data || []);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", "Failed to load field equipment list.");
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

  // Handover Execution
  const handleHandover = async (item: AllocationEquipmentDetail) => {
    try {
      setActionLoadingId(item.allocationEquipmentDetailId);
      await handoverEquipment(item.allocationEquipmentDetailId);
      Alert.alert(
        "Handover Successful!",
        `Equipment "${item.allocatedEquipmentTypeName || item.assetCode}" has been set to In Use status.`
      );
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to accept equipment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Return Execution
  const handleReturnSubmit = async () => {
    if (!returnItem) return;
    try {
      setActionLoadingId(returnItem.allocationEquipmentDetailId);
      await returnEquipment(returnItem.allocationEquipmentDetailId);
      Alert.alert(
        "Return Successful!",
        `Equipment "${returnItem.allocatedEquipmentTypeName || returnItem.assetCode}" has been returned to storage (Available).`
      );
      setReturnItem(null);
      setReturnNotes("");
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to return equipment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const status = item.status || "Allocated";
      const matchesTab =
        tabFilter === "all" ||
        (tabFilter === "inuse" && status === "InUse") ||
        (tabFilter === "allocated" && (status === "Allocated" || status === "Reserved")) ||
        (tabFilter === "completed" && status === "Completed");

      if (!matchesTab) return false;
      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      const name = (item.allocatedEquipmentTypeName || "").toLowerCase();
      const code = (item.assetCode || "").toLowerCase();
      const exp = (item.experimentName || "").toLowerCase();

      return name.includes(q) || code.includes(q) || exp.includes(q);
    });
  }, [items, tabFilter, searchTerm]);

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    let conf = Colors.status.allocated;
    let label = "Allocated";

    if (status === "InUse") {
      conf = Colors.status.inUse;
      label = "In Use";
    } else if (status === "Completed") {
      conf = Colors.status.completed;
      label = "Returned";
    }

    return (
      <View style={[styles.badge, { backgroundColor: conf.bg, borderColor: conf.border }]}>
        <Text style={[styles.badgeText, { color: conf.text }]}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.fullName || "Field Staff"}</Text>
          <Text style={styles.roleSubtext}>
            Role: {role === "Technician" ? "Field Technician" : "Seasonal Staff"}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={onRefresh}>
          <Ionicons name="reload" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by equipment name, asset code, experiment..."
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
      <View style={styles.tabFilterRow}>
        {[
          { key: "all", label: "All" },
          { key: "allocated", label: "Allocated" },
          { key: "inuse", label: "In Use" },
          { key: "completed", label: "Completed" },
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
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading allocated equipment...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cube-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No matching equipment found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.allocationEquipmentDetailId)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isProcessing = actionLoadingId === item.allocationEquipmentDetailId;
            const canHandover = item.status === "Allocated" || item.status === "Reserved";
            const canReturn = item.status === "InUse";

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.equipmentName}>
                      {item.allocatedEquipmentTypeName || "Forestry Equipment"}
                    </Text>
                    {item.assetCode ? (
                      <View style={styles.assetBadge}>
                        <Text style={styles.assetBadgeText}>{item.assetCode}</Text>
                      </View>
                    ) : null}
                  </View>
                  {renderStatusBadge(item.status)}
                </View>

                {item.experimentName ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="flask-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {item.experimentName}
                    </Text>
                  </View>
                ) : null}

                {item.phaseName ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="layers-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {item.phaseName}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>
                    Valid: {item.startDate ? item.startDate.split("T")[0] : "-"} to{" "}
                    {item.endDate ? item.endDate.split("T")[0] : "-"}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                  {canHandover ? (
                    <TouchableOpacity
                      style={styles.handoverBtn}
                      disabled={isProcessing}
                      onPress={() => handleHandover(item)}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
                          <Text style={styles.handoverBtnText}>Accept Equipment</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}

                  {canReturn ? (
                    <TouchableOpacity
                      style={styles.returnBtn}
                      disabled={isProcessing}
                      onPress={() => {
                        setReturnItem(item);
                        setReturnCondition("Good");
                        setReturnNotes("");
                      }}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="return-down-back-outline" size={16} color="#ffffff" />
                          <Text style={styles.returnBtnText}>Return to Storage</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}

                  {item.status === "Completed" ? (
                    <View style={styles.completedNote}>
                      <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
                      <Text style={styles.completedNoteText}>Returned to storage</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Return Modal */}
      <Modal visible={!!returnItem} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Equipment Return</Text>
              <TouchableOpacity onPress={() => setReturnItem(null)}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Asset Code: <Text style={{ fontWeight: "700", color: Colors.text }}>{returnItem?.assetCode || "Default"}</Text> -{" "}
              {returnItem?.allocatedEquipmentTypeName}
            </Text>

            <Text style={styles.modalLabel}>Equipment condition after use:</Text>
            <View style={styles.conditionRow}>
              {["Good", "Fair", "Damaged"].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.conditionBtn, returnCondition === c && styles.conditionBtnActive]}
                  onPress={() => setReturnCondition(c)}
                >
                  <Text style={[styles.conditionBtnText, returnCondition === c && styles.conditionBtnTextActive]}>
                    {c === "Good" ? "Good" : c === "Fair" ? "Fair" : "Damaged / Broken"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Inspection notes (Optional):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Fully recharged battery, cleaned after measurements..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              value={returnNotes}
              onChangeText={setReturnNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReturnItem(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmReturnBtn} onPress={handleReturnSubmit}>
                <Text style={styles.confirmReturnBtnText}>Confirm Return</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
