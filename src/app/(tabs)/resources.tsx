import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getEquipments, deleteEquipment } from "../../api/equipmentApi";
import {
  getHumanResourceProfiles,
  deleteHumanResourceProfile,
} from "../../api/personnelApi";
import { getLands, deleteLand } from "../../api/landApi";
import { getAreas, AreaItem } from "../../api/areaApi";
import { EquipmentItem } from "../../types/equipment";
import { HumanResourceProfile, HumanResourceStatus } from "../../types/personnel";
import { LandItem } from "../../types/land";
import { EditPersonnelModal } from "../../components/EditPersonnelModal";
import { EditLandModal } from "../../components/EditLandModal";
import { EditEquipmentModal } from "../../components/EditEquipmentModal";
import { Colors } from "../../constants/colors";
import { styles } from "../../styles/resources.styles";

type ResourceTab = "land" | "equipment" | "personnel";

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ResourceTab>("land");
  const [search, setSearch] = useState("");

  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [personnel, setPersonnel] = useState<HumanResourceProfile[]>([]);
  const [lands, setLands] = useState<LandItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Personnel Modal State
  const [selectedPersonnel, setSelectedPersonnel] = useState<HumanResourceProfile | null>(null);
  const [editPersonnelModalVisible, setEditPersonnelModalVisible] = useState(false);

  // Land Modal State
  const [selectedLand, setSelectedLand] = useState<LandItem | null>(null);
  const [editLandModalVisible, setEditLandModalVisible] = useState(false);

  // Equipment Modal State
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [editEquipmentModalVisible, setEditEquipmentModalVisible] = useState(false);

  // Load all resources and areas concurrently upfront
  const loadResources = useCallback(async () => {
    try {
      const [equipData, personData, landData, areaData] = await Promise.all([
        getEquipments({ Size: 100 }).catch((e) => {
          console.error("getEquipments error:", e);
          return [] as EquipmentItem[];
        }),
        getHumanResourceProfiles().catch((e) => {
          console.error("getHumanResourceProfiles error:", e);
          return [] as HumanResourceProfile[];
        }),
        getLands({ Size: 200 }).catch((e) => {
          console.error("getLands error:", e);
          return [] as LandItem[];
        }),
        getAreas().catch((e) => {
          console.error("getAreas error:", e);
          return [] as AreaItem[];
        }),
      ]);

      setEquipments(equipData || []);
      setPersonnel(personData || []);
      setLands(landData || []);

      // If backend areas returned, use them; if empty, derive areas from lands
      if (areaData && areaData.length > 0) {
        setAreas(areaData);
        if (selectedAreaId === null) {
          setSelectedAreaId(areaData[0].areaId);
        }
      } else if (landData && landData.length > 0) {
        const areaMap = new Map<number, AreaItem>();
        landData.forEach((l) => {
          const aid = l.areaId || 1;
          if (!areaMap.has(aid)) {
            areaMap.set(aid, {
              areaId: aid,
              areaName: l.areaName || `Area #${aid}`,
              description: l.soilType ? `${l.soilType} Area` : "Research Area",
              soilType: l.soilType,
            });
          }
        });
        const derived = Array.from(areaMap.values());
        setAreas(derived);
        if (selectedAreaId === null && derived.length > 0) {
          setSelectedAreaId(derived[0].areaId);
        }
      }
    } catch (err) {
      console.error("Load all resources error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAreaId]);

  useEffect(() => {
    setLoading(true);
    loadResources();
  }, [loadResources]);

  const onRefresh = () => {
    setRefreshing(true);
    loadResources();
  };

  // --- Handlers for Personnel ---
  const handleEditPersonnel = (item: HumanResourceProfile) => {
    setSelectedPersonnel(item);
    setEditPersonnelModalVisible(true);
  };

  const handleDeletePersonnel = (item: HumanResourceProfile) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the personnel profile "${item.fullName || item.email || "this person"}" from the system?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteHumanResourceProfile(item.humanResourceId);
              Alert.alert("Success", "Personnel profile deleted successfully!");
              loadResources();
            } catch (err: any) {
              console.error("Delete personnel error:", err);
              Alert.alert(
                "Error",
                err?.response?.data?.message || "Failed to delete personnel profile. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // --- Handlers for Land ---
  const handleAddLand = () => {
    setSelectedLand(null);
    setEditLandModalVisible(true);
  };

  const handleEditLand = (item: LandItem) => {
    setSelectedLand(item);
    setEditLandModalVisible(true);
  };

  const handleDeleteLand = (item: LandItem) => {
    Alert.alert(
      "Confirm Delete Land Plot",
      `Are you sure you want to delete land plot "${item.landCode || item.landName}" from the system?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteLand(item.landId);
              Alert.alert("Success", `Land plot "${item.landCode || item.landName}" has been deleted!`);
              loadResources();
            } catch (err: any) {
              console.error("Delete land error:", err);
              Alert.alert(
                "Error",
                err?.response?.data?.message || "Failed to delete land plot. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // --- Handlers for Equipment ---
  const handleAddEquipment = () => {
    setSelectedEquipment(null);
    setEditEquipmentModalVisible(true);
  };

  const handleEditEquipment = (item: EquipmentItem) => {
    setSelectedEquipment(item);
    setEditEquipmentModalVisible(true);
  };

  const handleDeleteEquipment = (item: EquipmentItem) => {
    Alert.alert(
      "Confirm Delete Equipment",
      `Are you sure you want to delete equipment "${item.equipmentName}" (@${item.equipmentCode})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEquipment(item.equipmentId);
              Alert.alert("Success", `Equipment "${item.equipmentName}" has been deleted!`);
              loadResources();
            } catch (err: any) {
              console.error("Delete equipment error:", err);
              Alert.alert(
                "Error",
                err?.response?.data?.message || "Failed to delete equipment. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // Filter items
  const filteredEquipments = equipments.filter(
    (e) =>
      (e.equipmentName || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.equipmentCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.typeName || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredPersonnel = personnel.filter(
    (u) =>
      (u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.roleName || "").toLowerCase().includes(search.toLowerCase())
  );

  // Land filtering: by search + by selected Area
  const filteredLands = lands.filter((l) => {
    const matchesSearch =
      (l.landCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.soilType || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.areaName || "").toLowerCase().includes(search.toLowerCase());

    const matchesArea =
      selectedAreaId === null || l.areaId === selectedAreaId;

    return matchesSearch && matchesArea;
  });

  const getStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "available" || s === "ready" || s === "active") {
      return { label: "Available", bg: "#f0fdf4", text: "#16a34a", dot: "#16a34a" };
    }
    if (s === "inuse" || s === "in_use" || s === "assigned" || s === "running") {
      return { label: "InUse", bg: "#eff6ff", text: "#2563eb", dot: "#2563eb" };
    }
    if (s === "busy") {
      return { label: "Busy", bg: "#ffedd5", text: "#ea580c", dot: "#ea580c" };
    }
    if (s === "maintenance" || s === "repair") {
      return { label: "Maintenance", bg: "#fef3c7", text: "#d97706", dot: "#d97706" };
    }
    if (s === "unavailable" || s === "inactive" || s === "broken") {
      return { label: "Inactive", bg: "#fee2e2", text: "#dc2626", dot: "#dc2626" };
    }
    return { label: status || "Available", bg: "#f0fdf4", text: "#16a34a", dot: "#16a34a" };
  };

  const getRoleBadgeStyle = (roleName?: string | null) => {
    const r = (roleName || "").toLowerCase();
    if (r.includes("seasonal") || r.includes("thời vụ")) {
      return {
        container: styles.roleBadgeSeasonal,
        text: styles.roleBadgeTextSeasonal,
      };
    }
    if (r.includes("technician") || r.includes("kỹ thuật") || r.includes("tech")) {
      return {
        container: styles.roleBadgeTechnician,
        text: styles.roleBadgeTextTechnician,
      };
    }
    return {
      container: styles.roleBadgeDefault,
      text: styles.roleBadgeTextDefault,
    };
  };

  const activeAreaObj = areas.find((a) => a.areaId === selectedAreaId);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top > 0 ? insets.top : 8 },
      ]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>Field Resources Management</Text>
            <Text style={styles.subtitle}>
              Manage Land Areas, Resource Equipments, and Human Resources
            </Text>
          </View>
        </View>

        {/* Tab switcher: Land & Areas, Resource Equipments, Human Resources (Horizontally Scrollable) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabRow}
        >
          {[
            { key: "land", label: `Land & Areas (${lands.length})` },
            { key: "equipment", label: `Resource Equipments (${equipments.length})` },
            { key: "personnel", label: `Human Resources (${personnel.length})` },
          ].map((t) => {
            const isActive = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => {
                  setActiveTab(t.key as ResourceTab);
                  setSearch("");
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    isActive && styles.tabBtnTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* LAND TAB: Areas List + Plots in Selected Area */}
      {activeTab === "land" && (
        <View style={{ flex: 1 }}>
          {/* Areas Section (List of Land Areas) */}
          <View style={styles.areaSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Areas list</Text>
              <TouchableOpacity
                onPress={() => setSelectedAreaId(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionSubtitle}>
                  {selectedAreaId === null ? "Selecting all" : "View all"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.areaListScroll}
            >
              {areas.map((a) => {
                const isSelected = selectedAreaId === a.areaId;
                const plotCount = lands.filter((l) => l.areaId === a.areaId).length;
                return (
                  <TouchableOpacity
                    key={a.areaId}
                    style={[styles.areaCard, isSelected && styles.areaCardActive]}
                    onPress={() =>
                      setSelectedAreaId(isSelected ? null : a.areaId)
                    }
                    activeOpacity={0.85}
                  >
                    <View style={styles.areaCardHeader}>
                      <Text
                        style={[
                          styles.areaCardTitle,
                          isSelected && styles.areaCardTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {a.areaName}
                      </Text>
                      <Ionicons
                        name={
                          isSelected
                            ? "checkmark-circle"
                            : "chevron-forward-circle-outline"
                        }
                        size={18}
                        color={isSelected ? Colors.primary : "#94a3b8"}
                      />
                    </View>

                    <Text style={styles.areaCardDesc} numberOfLines={2}>
                      {a.description || "Field research area"}
                    </Text>

                    <View style={styles.areaCardFooter}>
                      <View style={styles.areaPlotBadge}>
                        <Text style={styles.areaPlotText}>
                          {plotCount} {plotCount === 1 ? "plot" : "plots"}
                        </Text>
                      </View>
                      {a.soilType ? (
                        <View style={styles.areaSoilBadge}>
                          <Text style={styles.areaSoilText}>{a.soilType}</Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Banner for Active Area Land Resources */}
          <View style={styles.resourceHeaderBanner}>
            <View style={styles.resourceHeaderTitleWrap}>
              <Text style={styles.resourceHeaderTitle} numberOfLines={1}>
                {activeAreaObj
                  ? `${activeAreaObj.areaName} – Land Resources`
                  : "All Areas – Land Resources"}
              </Text>
              <Text style={styles.resourceHeaderSubtitle}>
                {filteredLands.length} plots available
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionAddBtn}
              onPress={handleAddLand}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={15} color="#ffffff" />
              <Text style={styles.actionAddBtnText}>Add Land</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar for Land Plots */}
          <View style={styles.searchBarWrap}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search lands in area..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Plots FlatList */}
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading land plots...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredLands}
              keyExtractor={(item) => String(item.landId || Math.random())}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[Colors.primary]}
                  tintColor={Colors.primary}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="leaf-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyText}>
                    No land plots found in this area.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const st = getStatusBadge(item.status);
                return (
                  <View style={styles.card}>
                    {/* Top Row: Leaf Icon + Land Code & Area + Status Pill */}
                    <View style={styles.cardTop}>
                      <View
                        style={[
                          styles.iconBox,
                          { backgroundColor: "#f0fdf4" },
                        ]}
                      >
                        <Ionicons name="leaf" size={20} color="#16a34a" />
                      </View>
                      <View style={styles.cardTitleWrap}>
                        <Text style={styles.cardTitle}>
                          {item.landCode || `PLOT-${item.landId}`}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                          {item.areaName || "Research Area"}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: st.bg },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: st.dot },
                          ]}
                        />
                        <Text style={[styles.statusText, { color: st.text }]}>
                          {st.label}
                        </Text>
                      </View>
                    </View>

                    {/* Detail Grid matching Web FE */}
                    <View style={styles.detailGrid}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>SIZE (M²)</Text>
                        <Text style={styles.detailValue}>
                          {item.areaSize || item.area || "-"} m²
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>SOIL TYPE</Text>
                        <Text style={styles.detailValue}>
                          {item.soilType || "Forest soil"}
                        </Text>
                      </View>
                      {item.location ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>LOCATION</Text>
                          <Text style={styles.detailValue}>{item.location}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Actions: Edit & Delete */}
                    <View style={styles.cardFooterActions}>
                      <TouchableOpacity
                        style={styles.actionBtnEdit}
                        onPress={() => handleEditLand(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil" size={13} color="#2563eb" />
                        <Text style={styles.actionTextEdit}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnDelete}
                        onPress={() => handleDeleteLand(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={13} color="#dc2626" />
                        <Text style={styles.actionTextDelete}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* EQUIPMENT TAB */}
      {activeTab === "equipment" && (
        <View style={{ flex: 1 }}>
          {/* Banner with Add Equipment Button */}
          <View style={styles.resourceHeaderBanner}>
            <View style={styles.resourceHeaderTitleWrap}>
              <Text style={styles.resourceHeaderTitle} numberOfLines={1}>
                Resource Equipments
              </Text>
              <Text style={styles.resourceHeaderSubtitle}>
                {filteredEquipments.length} assets in system
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionAddBtn}
              onPress={handleAddEquipment}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={15} color="#ffffff" />
              <Text style={styles.actionAddBtnText}>Add Equipment</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBarWrap}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by equipment name, code, type..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading equipment list...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredEquipments}
              keyExtractor={(item) => String(item.equipmentId || Math.random())}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[Colors.primary]}
                  tintColor={Colors.primary}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="construct-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No equipment found.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const st = getStatusBadge(item.status);
                return (
                  <View style={styles.card}>
                    <View style={styles.cardTop}>
                      <View style={[styles.iconBox, { backgroundColor: "#fffbeb" }]}>
                        <Ionicons name="construct" size={20} color="#d97706" />
                      </View>
                      <View style={styles.cardTitleWrap}>
                        <Text style={styles.cardTitle}>{item.equipmentName}</Text>
                        <Text style={styles.cardSubtitle}>
                          {item.typeName || "Specialized equipment"}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: st.dot }]} />
                        <Text style={[styles.statusText, { color: st.text }]}>
                          {st.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailGrid}>
                      {item.equipmentCode ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Equipment Code</Text>
                          <Text style={styles.detailValue}>{item.equipmentCode}</Text>
                        </View>
                      ) : null}
                      {item.serialNumber ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Serial Number</Text>
                          <Text style={styles.detailValue}>{item.serialNumber}</Text>
                        </View>
                      ) : null}
                      {item.efficiencyScore != null ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Operating Efficiency</Text>
                          <Text style={styles.detailValue}>
                            {Math.round(
                              item.efficiencyScore > 1
                                ? item.efficiencyScore
                                : item.efficiencyScore * 100
                            )}
                          </Text>
                        </View>
                      ) : null}
                      {item.maintenanceStatus ? (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Maintenance Status</Text>
                          <Text style={styles.detailValue}>{item.maintenanceStatus}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Actions: Edit & Delete */}
                    <View style={styles.cardFooterActions}>
                      <TouchableOpacity
                        style={styles.actionBtnEdit}
                        onPress={() => handleEditEquipment(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil" size={13} color="#2563eb" />
                        <Text style={styles.actionTextEdit}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnDelete}
                        onPress={() => handleDeleteEquipment(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={13} color="#dc2626" />
                        <Text style={styles.actionTextDelete}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* PERSONNEL TAB */}
      {activeTab === "personnel" && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBarWrap}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, email, role..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading human resources...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPersonnel}
              keyExtractor={(item) => String(item.humanResourceId || item.userId || Math.random())}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[Colors.primary]}
                  tintColor={Colors.primary}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No field personnel found.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const st = getStatusBadge(item.status);
                const roleStyle = getRoleBadgeStyle(item.roleName);
                return (
                  <View style={styles.card}>
                    <View style={styles.cardTop}>
                      <View style={[styles.iconBox, { backgroundColor: "#faf5ff" }]}>
                        <Ionicons name="person" size={20} color="#9333ea" />
                      </View>
                      <View style={styles.cardTitleWrap}>
                        <Text style={styles.cardTitle}>
                          {item.fullName || "Personnel"}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                          {item.email || (item.username ? `@${item.username}` : "-")}
                        </Text>
                      </View>
                      <View style={styles.badgeRow}>
                        {item.roleName ? (
                          <View style={[styles.roleBadge, roleStyle.container]}>
                            <Text style={[styles.roleBadgeText, roleStyle.text]}>
                              {item.roleName}
                            </Text>
                          </View>
                        ) : null}
                        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                          <View style={[styles.statusDot, { backgroundColor: st.dot }]} />
                          <Text style={[styles.statusText, { color: st.text }]}>
                            {st.label}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.detailGrid}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Max Hours/Day</Text>
                        <Text style={styles.detailValue}>
                          {item.maxWorkingHoursPerDay} hrs
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Current Workload</Text>
                        <Text style={styles.detailValue}>
                          {item.currentWorkload}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooterActions}>
                      <TouchableOpacity
                        style={styles.actionBtnEdit}
                        onPress={() => handleEditPersonnel(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil" size={13} color="#2563eb" />
                        <Text style={styles.actionTextEdit}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnDelete}
                        onPress={() => handleDeletePersonnel(item)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={13} color="#dc2626" />
                        <Text style={styles.actionTextDelete}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* Edit Personnel Modal */}
      <EditPersonnelModal
        visible={editPersonnelModalVisible}
        profile={selectedPersonnel}
        onClose={() => {
          setEditPersonnelModalVisible(false);
          setSelectedPersonnel(null);
        }}
        onSuccess={loadResources}
      />

      {/* Edit Land Modal */}
      <EditLandModal
        visible={editLandModalVisible}
        land={selectedLand}
        defaultAreaId={selectedAreaId || undefined}
        onClose={() => {
          setEditLandModalVisible(false);
          setSelectedLand(null);
        }}
        onSuccess={loadResources}
      />

      {/* Edit Equipment Modal */}
      <EditEquipmentModal
        visible={editEquipmentModalVisible}
        equipment={selectedEquipment}
        onClose={() => {
          setEditEquipmentModalVisible(false);
          setSelectedEquipment(null);
        }}
        onSuccess={loadResources}
      />
    </View>
  );
}
