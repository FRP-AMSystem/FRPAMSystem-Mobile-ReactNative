import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { createAllocationPlan } from "../api/allocationPlanApi";
import client from "../api/client";
import { getEquipmentTypes, EquipmentTypeItem } from "../api/equipmentTypeApi";
import { getEquipments } from "../api/equipmentApi";
import {
  getExperimentEquipmentRequirements,
  getExperimentHumanRequirements,
  getExperimentLandRequirements,
} from "../api/experimentRequirementApi";
import { getLands } from "../api/landApi";
import { getHumanResourceProfiles } from "../api/personnelApi";
import { createSchedule } from "../api/scheduleApi";
import { Colors } from "../constants/colors";
import { EquipmentItem } from "../types/equipment";
import {
  ExperimentEquipmentRequirementItem,
  ExperimentHumanRequirementItem,
  ExperimentItem,
  ExperimentLandRequirementItem,
} from "../types/experiment";
import { LandItem } from "../types/land";
import { HumanResourceProfile } from "../types/personnel";
import { AISuggestionModal } from "./AISuggestionModal";
import { styles } from "./AllocateResourcesModal.styles";

interface AllocateResourcesModalProps {
  visible: boolean;
  experiment: ExperimentItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

type CategoryTab = "equipment" | "human" | "land";

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "-";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

function normalizeDate(d?: string | null): string {
  if (!d) return new Date().toISOString();
  if (d.includes("T")) return d;
  return `${d}T00:00:00`;
}

export function AllocateResourcesModal({
  visible,
  experiment,
  onClose,
  onSuccess,
}: AllocateResourcesModalProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<CategoryTab>("equipment");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  // Requirements
  const [equipReqs, setEquipReqs] = useState<ExperimentEquipmentRequirementItem[]>([]);
  const [humanReqs, setHumanReqs] = useState<ExperimentHumanRequirementItem[]>([]);
  const [landReqs, setLandReqs] = useState<ExperimentLandRequirementItem[]>([]);

  // Warehouse/System Master Data
  const [allEquipmentTypes, setAllEquipmentTypes] = useState<EquipmentTypeItem[]>([]);
  const [allEquipments, setAllEquipments] = useState<EquipmentItem[]>([]);
  const [allPersonnel, setAllPersonnel] = useState<HumanResourceProfile[]>([]);
  const [allLands, setAllLands] = useState<LandItem[]>([]);

  // Existing Occupations / Schedule Conflicts
  const [activeEquipDetails, setActiveEquipDetails] = useState<any[]>([]);
  const [activeHumanDetails, setActiveHumanDetails] = useState<any[]>([]);
  const [activeLandDetails, setActiveLandDetails] = useState<any[]>([]);

  // Selected Resources
  // map: reqId -> array of selected resource Ids (for Individual equipment, human, land)
  const [selectedEquipMap, setSelectedEquipMap] = useState<Record<number, number[]>>({});
  // map: reqId -> quantity selected (for QuantityBased equipment)
  const [selectedEquipQuantityMap, setSelectedEquipQuantityMap] = useState<Record<number, number>>({});
  const [selectedHumanMap, setSelectedHumanMap] = useState<Record<number, number[]>>({});
  const [selectedLandMap, setSelectedLandMap] = useState<Record<number, number[]>>({});

  const loadAllData = useCallback(async () => {
    if (!experiment?.experimentId) return;
    try {
      setLoading(true);
      const expId = experiment.experimentId;

      const [
        eqReq,
        huReq,
        laReq,
        eqTypes,
        eqList,
        huList,
        laList,
        activeEqRes,
        activeHuRes,
        activeLaRes,
      ] = await Promise.allSettled([
        getExperimentEquipmentRequirements(expId),
        getExperimentHumanRequirements(expId),
        getExperimentLandRequirements(expId),
        getEquipmentTypes(),
        getEquipments({ Size: 200 }),
        getHumanResourceProfiles(),
        getLands({ Size: 200 }),
        client.get("/AllocationEquipmentDetails", { params: { Size: 300 } }),
        client.get("/AllocationHumanDetails", { params: { Size: 300 } }),
        client.get("/AllocationLandDetails", { params: { Size: 300 } }),
      ]);

      const getItems = (r: PromiseSettledResult<any>): any[] => {
        if (r.status !== "fulfilled") return [];
        const d = r.value?.data;
        if (!d) return [];
        if (Array.isArray(d)) return d;
        if (Array.isArray(d.items)) return d.items;
        if (Array.isArray(d.data)) return d.data;
        if (Array.isArray(d.data?.items)) return d.data.items;
        return [];
      };

      const getArr = (r: PromiseSettledResult<any>): any[] => {
        if (r.status !== "fulfilled") return [];
        const v = r.value;
        if (Array.isArray(v)) return v;
        if (v && Array.isArray(v.data)) return v.data;
        if (v && Array.isArray(v.items)) return v.items;
        return [];
      };

      const deduplicate = <T,>(arr: T[], keyFn: (item: T) => any): T[] => {
        const seen = new Set();
        return arr.filter((item) => {
          if (!item) return false;
          const key = keyFn(item);
          if (key == null || key === "") return true;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };

      const rawEqReqs = deduplicate(getArr(eqReq), (r: any) => r.expEquipmentReqId || `${r.experimentId}-${r.equipmentTypeId}`);
      const rawHuReqs = deduplicate(getArr(huReq), (r: any) => r.expHumanReqId || `${r.experimentId}-${r.roleId}`);
      const rawLaReqs = deduplicate(getArr(laReq), (r: any) => r.expLandReqId || `${r.experimentId}-${r.requiredSoilType}-${r.requiredArea}`);

      const rawTypes = deduplicate(getArr(eqTypes), (t: any) => t.equipmentTypeId);
      const rawEquips = deduplicate(getArr(eqList), (eq: any) => eq.equipmentId);
      const rawPersonnel = deduplicate(getArr(huList), (hu: any) => hu.humanResourceId || hu.userId || hu.profileId);
      const rawLands = deduplicate(getArr(laList), (la: any) => la.landId);

      setEquipReqs(rawEqReqs);
      setHumanReqs(rawHuReqs);
      setLandReqs(rawLaReqs);

      setAllEquipmentTypes(rawTypes);
      setAllEquipments(rawEquips);
      setAllPersonnel(rawPersonnel);
      setAllLands(rawLands);

      setActiveEquipDetails(getItems(activeEqRes));
      setActiveHumanDetails(getItems(activeHuRes));
      setActiveLandDetails(getItems(activeLaRes));
    } catch (err) {
      console.error("Load allocation requirements error:", err);
      Alert.alert("Error", "Could not load experiment requirements and resources.");
    } finally {
      setLoading(false);
    }
  }, [experiment]);

  useEffect(() => {
    if (visible && experiment) {
      setSelectedEquipMap({});
      setSelectedEquipQuantityMap({});
      setSelectedHumanMap({});
      setSelectedLandMap({});
      setActiveTab("equipment");
      loadAllData();
    }
  }, [visible, experiment, loadAllData]);

  // Check Equipment Eligibility with detailed reasons
  const evaluateEquipment = (
    item: EquipmentItem,
    req: ExperimentEquipmentRequirementItem
  ) => {
    const isMatchingType = Number(item.typeId) === Number(req.equipmentTypeId);
    const allowSubstitute = Boolean(req.allowSubstitute);

    const statusLower = (item.status || "").toLowerCase().trim();
    const maintLower = (item.maintenanceStatus || "").toLowerCase().trim();

    // Maintenance check
    const isMaintenance =
      maintLower.includes("maintenance") ||
      statusLower.includes("maintenance");

    // Broken check
    const isBroken =
      statusLower.includes("broken") ||
      statusLower.includes("damaged") ||
      statusLower.includes("critical") ||
      statusLower.includes("fault");

    // Allocated check
    const isAllocated =
      statusLower.includes("allocated") ||
      statusLower.includes("inuse") ||
      statusLower.includes("in_use") ||
      statusLower.includes("busy") ||
      statusLower.includes("assigned");

    // Busy / Schedule overlap check from active details
    const equipList = Array.isArray(activeEquipDetails) ? activeEquipDetails : [];
    const isBusy = equipList.some((d: any) => {
      if (!d || Number(d.equipmentInstanceId) !== item.equipmentId) return false;
      const status = (d.status || "").toLowerCase();
      if (status === "cancelled" || status === "completed") return false;
      return true;
    });

    let eligible = false;
    let reason = "";

    if (isBroken) {
      eligible = false;
      reason = "Device experiencing issues / Malfunctioning (Unavailable)";
    } else if (isMaintenance) {
      eligible = false;
      reason = "Equipment is undergoing maintenance / periodic inspection.";
    } else if (isAllocated || isBusy) {
      eligible = false;
      reason = "The equipment is currently allocated / in use.";
    } else if (!isMatchingType && !allowSubstitute) {
      eligible = false;
      reason = "Different from the required equipment type (Substitution not allowed)";
    } else if (!isMatchingType && allowSubstitute) {
      eligible = true;
      reason = "Valid substitute device (According to allowed configuration)";
    } else {
      eligible = true;
      reason = "Device is ready in stock (Meets quality standards)";
    }

    return { eligible, reason };
  };

  // Check Human Resource Eligibility with detailed reasons
  const evaluateHuman = (
    person: HumanResourceProfile,
    req: ExperimentHumanRequirementItem
  ) => {
    const isMatchingRole =
      (req.roleId && Number(person.roleId) === Number(req.roleId)) ||
      (req.roleName &&
        person.roleName?.toLowerCase().includes(req.roleName.toLowerCase()));

    const isBusyStatus =
      person.status === "Busy" ||
      person.status === "Unavailable" ||
      person.status === "Inactive";

    const requiredHours = Number(req.workingHoursPerDay || 8);
    const isOverloaded =
      Number(person.currentWorkload || 0) + requiredHours >
      Number(person.maxWorkingHoursPerDay || 8);

    const humanList = Array.isArray(activeHumanDetails) ? activeHumanDetails : [];
    const hasScheduleConflict = humanList.some((d: any) => {
      if (!d || Number(d.humanResourceId) !== person.humanResourceId) return false;
      const status = (d.status || "").toLowerCase();
      return status !== "cancelled" && status !== "completed";
    });

    let eligible = false;
    let reason = "";

    if (isBusyStatus) {
      eligible = false;
      reason = `Staff status: ${person.status} (Busy / Absent)`;
    } else if (isOverloaded) {
      eligible = false;
      reason = `Exceeds maximum working hours (${person.currentWorkload}h + ${requiredHours}h > ${person.maxWorkingHoursPerDay}h/day)`;
    } else if (hasScheduleConflict) {
      eligible = false;
      reason = "Schedule conflict (Assigned to another experiment in this time slot)";
    } else if (!isMatchingRole) {
      eligible = false;
      reason = `Role mismatch (Required: ${req.roleName || "Expert"}, Current: ${person.roleName || "Other"})`;
    } else {
      eligible = true;
      reason = `Staff is ready (Current workload: ${person.currentWorkload}/${person.maxWorkingHoursPerDay}h)`;
    }

    return { eligible, reason };
  };

  // Check Land Eligibility with detailed reasons
  const evaluateLand = (land: LandItem, req: ExperimentLandRequirementItem) => {
    const landList = Array.isArray(activeLandDetails) ? activeLandDetails : [];
    const isOccupied = landList.some((d: any) => {
      if (!d || Number(d.landId) !== land.landId) return false;
      const status = (d.status || "").toLowerCase();
      return status !== "cancelled" && status !== "completed";
    });

    const landArea = Number(land.areaSize || land.area || 0);
    const isEnoughArea = landArea >= Number(req.requiredArea || 0);

    const isMatchingSoil =
      !req.requiredSoilType ||
      (land.soilType || "")
        .toLowerCase()
        .includes(req.requiredSoilType.toLowerCase());

    const statusLower = (land.status || "available").toLowerCase().trim();
    const isAvailableStatus =
      statusLower === "available" || statusLower === "ready" || statusLower === "active";
    const isOccupiedStatus =
      statusLower.includes("allocated") ||
      statusLower.includes("occupied") ||
      statusLower.includes("busy") ||
      statusLower.includes("inuse");

    let eligible = false;
    let reason = "";

    if (isOccupied || isOccupiedStatus) {
      eligible = false;
      reason = "Land is being used / allocated for another experiment";
    } else if (!isEnoughArea) {
      eligible = false;
      reason = `Insufficient area (${landArea}m² < ${req.requiredArea}m² required)`;
    } else if (!isMatchingSoil) {
      eligible = false;
      reason = `Soil type mismatch (${land.soilType || "Other"} != ${req.requiredSoilType})`;
    } else if (!isAvailableStatus) {
      eligible = false;
      reason = `Land status: ${land.status} (Unavailable)`;
    } else {
      eligible = true;
      reason = `Land is ready for cultivation (${landArea}m² - Soil type: ${land.soilType || "Standard"})`;
    }

    return { eligible, reason };
  };

  // Toggle Equipment Selection
  const toggleEquipment = (reqId: number, eqId: number, maxQty: number) => {
    setSelectedEquipMap((prev) => {
      const current = prev[reqId] || [];
      if (current.includes(eqId)) {
        return { ...prev, [reqId]: current.filter((id) => id !== eqId) };
      }
      if (current.length >= maxQty) {
        Alert.alert(
          "Limit Reached",
          `Requirement only requires ${maxQty} unit(s). Please unselect another before adding.`
        );
        return prev;
      }
      return { ...prev, [reqId]: [...current, eqId] };
    });
  };

  // Toggle Human Selection
  const toggleHuman = (reqId: number, hrId: number, maxQty: number) => {
    setSelectedHumanMap((prev) => {
      const current = prev[reqId] || [];
      if (current.includes(hrId)) {
        return { ...prev, [reqId]: current.filter((id) => id !== hrId) };
      }
      if (current.length >= maxQty) {
        Alert.alert(
          "Limit Reached",
          `Requirement only requires ${maxQty} person(s).`
        );
        return prev;
      }
      return { ...prev, [reqId]: [...current, hrId] };
    });
  };

  // Toggle Land Selection
  const toggleLand = (reqId: number, landId: number) => {
    setSelectedLandMap((prev) => {
      const current = prev[reqId] || [];
      if (current.includes(landId)) {
        return { ...prev, [reqId]: [] };
      }
      return { ...prev, [reqId]: [landId] };
    });
  };

  // Count totals selected
  const totalEquipSelected = useMemo(() => {
    let count = 0;
    equipReqs.forEach((req, idx) => {
      const reqId = req.expEquipmentReqId || idx;
      const eqType = allEquipmentTypes.find(
        (t) => Number(t.equipmentTypeId) === Number(req.equipmentTypeId)
      );
      const isIndividual = String(eqType?.trackingType || "").toLowerCase().includes("individual");
      if (isIndividual) {
        count += (selectedEquipMap[reqId] || []).length;
      } else {
        count += (selectedEquipQuantityMap[reqId] || 0);
      }
    });
    return count;
  }, [equipReqs, allEquipmentTypes, selectedEquipMap, selectedEquipQuantityMap]);

  const totalHumanSelected = useMemo(
    () => Object.values(selectedHumanMap).reduce((sum, arr) => sum + arr.length, 0),
    [selectedHumanMap]
  );
  const totalLandSelected = useMemo(
    () => Object.values(selectedLandMap).reduce((sum, arr) => sum + arr.length, 0),
    [selectedLandMap]
  );

  // Manual Submission handler
  const handleSubmitManual = async () => {
    if (!experiment?.experimentId) return;

    // Check if at least some resources are selected
    if (totalEquipSelected === 0 && totalHumanSelected === 0 && totalLandSelected === 0) {
      Alert.alert(
        "No Resources Selected",
        "Please select at least one piece of equipment, personnel, or land plot before submitting."
      );
      return;
    }

    try {
      setSubmitting(true);
      const expId = experiment.experimentId;
      const startDate = normalizeDate(experiment.expectStartDate);
      const endDate = normalizeDate(experiment.expectEndDate);

      // 1. Create Allocation Plan
      const createdPlan = await createAllocationPlan({
        experimentId: expId,
        fitnessScore: 100,
        approveStatus: "Pending",
        advantages: ["Manual allocation configured by Lead Researcher"],
        disadvantages: [],
      });

      const planId = Number(createdPlan?.allocationPlanId || (createdPlan as any)?.id || 0);
      if (!planId) {
        throw new Error("Could not initialize allocation plan record.");
      }

      // 2. Persist Equipment Details (Individual instances)
      for (const [reqIdStr, eqIds] of Object.entries(selectedEquipMap)) {
        const reqId = Number(reqIdStr);
        const req = equipReqs.find((r) => r.expEquipmentReqId === reqId);
        const eqType = allEquipmentTypes.find((t) => Number(t.equipmentTypeId) === Number(req?.equipmentTypeId));
        const isIndividual = String(eqType?.trackingType || "").toLowerCase().includes("individual");

        if (isIndividual) {
          for (const eqId of eqIds) {
            const item = allEquipments.find((e) => e.equipmentId === eqId);
            if (item) {
              await client.post("/AllocationEquipmentDetails", {
                allocationPlanId: planId,
                expEquipmentReqId: req?.expEquipmentReqId || null,
                phaseEquipmentReqId: null,
                allocatedEquipmentTypeId: item.typeId || req?.equipmentTypeId || 1,
                equipmentInstanceId: item.equipmentId,
                quantity: 1,
                efficiencyRate: item.efficiencyScore ? item.efficiencyScore / 100 : 1.0,
                isSubstitute: item.typeId !== req?.equipmentTypeId,
                startDate,
                endDate,
                status: "Allocated",
              }).catch((e) => console.warn("Save equipment instance error:", e));
            }
          }
        }
      }

      // 2.2 Persist Equipment Details (Quantity-based)
      for (const [reqIdStr, qty] of Object.entries(selectedEquipQuantityMap)) {
        const reqId = Number(reqIdStr);
        const req = equipReqs.find((r) => r.expEquipmentReqId === reqId);
        const eqType = allEquipmentTypes.find((t) => Number(t.equipmentTypeId) === Number(req?.equipmentTypeId));
        const isIndividual = String(eqType?.trackingType || "").toLowerCase().includes("individual");

        if (!isIndividual && qty > 0) {
          await client.post("/AllocationEquipmentDetails", {
            allocationPlanId: planId,
            expEquipmentReqId: req?.expEquipmentReqId || null,
            phaseEquipmentReqId: null,
            allocatedEquipmentTypeId: req?.equipmentTypeId || 1,
            equipmentInstanceId: null,
            quantity: qty,
            efficiencyRate: 1.0,
            isSubstitute: false,
            startDate,
            endDate,
            status: "Allocated",
          }).catch((e) => console.warn("Save quantity equipment error:", e));
        }
      }

      // 3. Persist Human Details & Schedules
      for (const [reqIdStr, hrIds] of Object.entries(selectedHumanMap)) {
        const reqId = Number(reqIdStr);
        const req = humanReqs.find((r) => r.expHumanReqId === reqId);
        for (const hrId of hrIds) {
          const person = allPersonnel.find((p) => p.humanResourceId === hrId);
          if (person) {
            await client.post("/AllocationHumanDetails", {
              allocationPlanId: planId,
              expHumanReqId: req?.expHumanReqId || null,
              phaseHumanReqId: null,
              humanResourceId: person.humanResourceId,
              roleId: person.roleId || req?.roleId || 1,
              workingHours: req?.workingHoursPerDay || 8,
              startDate,
              endDate,
              status: "Allocated",
            }).catch((e) => console.warn("Save human detail error:", e));

            // Create schedule
            await createSchedule({
              allocationPlanId: planId,
              phaseId: null,
              title: `Duty: ${experiment.experimentName}`,
              description: `Assigned Staff: ${person.fullName || person.username}`,
              assignedHumanResourceId: person.humanResourceId,
              startDate,
              endDate,
              status: "Planned" as any,
              priority: Number(experiment.priority ?? 1),
            }).catch((e) => console.warn("Save schedule error:", e));
          }
        }
      }

      // 4. Persist Land Details
      for (const [reqIdStr, landIds] of Object.entries(selectedLandMap)) {
        const reqId = Number(reqIdStr);
        const req = landReqs.find((r) => r.expLandReqId === reqId);
        for (const landId of landIds) {
          const land = allLands.find((l) => l.landId === landId);
          if (land) {
            await client.post("/AllocationLandDetails", {
              allocationPlanId: planId,
              expLandReqId: req?.expLandReqId || null,
              phaseLandReqId: null,
              landId: land.landId,
              allocatedArea: land.areaSize || req?.requiredArea || 0,
              startDate,
              endDate,
              status: "Allocated",
            }).catch((e) => console.warn("Save land detail error:", e));
          }
        }
      }

      Alert.alert(
        "Allocation Submitted",
        "Your resource allocation plan has been successfully created and submitted for Manager approval!"
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Manual allocation submit error:", err);
      Alert.alert(
        "Submission Failed",
        err?.response?.data?.message || "Failed to submit resource allocation plan."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible || !experiment) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.fullContainer} edges={["bottom"]}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.expBadge}>
                <Ionicons name="flask" size={12} color="#15803d" />
                <Text style={styles.expBadgeText}>
                  {experiment.status || "Approved"}
                </Text>
              </View>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Allocate: {experiment.experimentName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Experiment Overview Banner */}
          <View style={styles.bannerCard}>
            <Text style={styles.bannerTitle}>Resource Allocation Guide</Text>
            <Text style={styles.bannerSub}>
              Select eligible equipment, field personnel, and forest plots for this study.
              Unavailable or conflicting resources are labeled with detailed reasons.
            </Text>
            <View style={styles.dateBadgeRow}>
              <Ionicons name="calendar-outline" size={15} color="#475569" />
              <Text style={styles.dateBadgeText}>
                Period: {formatDate(experiment.expectStartDate)} ➔ {formatDate(experiment.expectEndDate)}
              </Text>
            </View>
          </View>

          {/* Navigation Category Tabs */}
          <View style={styles.navTabsRow}>
            <TouchableOpacity
              style={[styles.navTab, activeTab === "equipment" && styles.navTabActive]}
              onPress={() => setActiveTab("equipment")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="construct-outline"
                size={16}
                color={activeTab === "equipment" ? "#ffffff" : "#64748b"}
              />
              <Text style={[styles.navTabText, activeTab === "equipment" && styles.navTabTextActive]}>
                Equipment ({totalEquipSelected})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navTab, activeTab === "human" && styles.navTabActive]}
              onPress={() => setActiveTab("human")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={activeTab === "human" ? "#ffffff" : "#64748b"}
              />
              <Text style={[styles.navTabText, activeTab === "human" && styles.navTabTextActive]}>
                Personnel ({totalHumanSelected})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navTab, activeTab === "land" && styles.navTabActive]}
              onPress={() => setActiveTab("land")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="leaf-outline"
                size={16}
                color={activeTab === "land" ? "#ffffff" : "#64748b"}
              />
              <Text style={[styles.navTabText, activeTab === "land" && styles.navTabTextActive]}>
                Land ({totalLandSelected})
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>
                Evaluating available resources & checking conflicts...
              </Text>
            </View>
          ) : (
            <>
              {/* 1. EQUIPMENT TAB */}
              {activeTab === "equipment" && (
                <View style={{ gap: 16 }}>
                  {equipReqs.length === 0 ? (
                    <View style={styles.bannerCard}>
                      <Text style={styles.emptyListText}>
                        This experiment has no equipment requirements defined.
                      </Text>
                    </View>
                  ) : (
                    equipReqs.map((req, reqIdx) => {
                      const reqId = req.expEquipmentReqId || reqIdx;
                      const eqType = allEquipmentTypes.find(
                        (t) => Number(t.equipmentTypeId) === Number(req.equipmentTypeId)
                      );
                      const isIndividual = String(eqType?.trackingType || "").toLowerCase().includes("individual");

                      // A. QUANTITY-BASED UI
                      if (!isIndividual) {
                        const currentQty = selectedEquipQuantityMap[reqId] || 0;
                        const inStock = eqType?.totalQuantity ?? 0;
                        const isComplete = currentQty >= req.quantity;
                        const hasEnoughStock = inStock >= req.quantity;

                        return (
                          <View
                            key={reqId}
                            style={[
                              styles.quantityCard,
                              isComplete && styles.quantityCardCompleted,
                            ]}
                          >
                            {/* Header: Title, Category & Selection Badge */}
                            <View style={styles.quantityHeaderRow}>
                              <View style={{ flex: 1, paddingRight: 8 }}>
                                <Text style={styles.quantityName}>
                                  {req.equipmentTypeName || eqType?.name || `Equipment Type #${req.equipmentTypeId}`}
                                </Text>
                                <View style={styles.quantityMetaRow}>
                                  <Text style={styles.quantityCategoryText}>
                                    {eqType?.equipmentCategoryName || "General Inventory"}
                                  </Text>
                                  <Text style={styles.quantityDot}>•</Text>
                                  <Text style={styles.quantityReqText}>
                                    Req: {req.quantity} unit(s)
                                  </Text>
                                </View>
                              </View>

                              {/* Fulfillment Badge */}
                              <View
                                style={[
                                  styles.countBadge,
                                  isComplete && styles.countBadgeComplete,
                                ]}
                              >
                                <Ionicons
                                  name={isComplete ? "checkmark-circle" : "cube-outline"}
                                  size={13}
                                  color={isComplete ? "#15803d" : "#475569"}
                                  style={{ marginRight: 3 }}
                                />
                                <Text
                                  style={[
                                    styles.countBadgeText,
                                    isComplete && styles.countBadgeTextComplete,
                                  ]}
                                >
                                  {currentQty} / {req.quantity} Selected
                                </Text>
                              </View>
                            </View>

                            {/* Action Row: Stepper & Quick Fill Buttons */}
                            <View style={styles.quantityActionRow}>
                              {/* Stepper */}
                              <View style={styles.stepperContainer}>
                                <TouchableOpacity
                                  style={[
                                    styles.stepperButton,
                                    currentQty <= 0 && styles.stepperButtonDisabled,
                                  ]}
                                  onPress={() => {
                                    if (currentQty > 0) {
                                      setSelectedEquipQuantityMap((prev) => ({
                                        ...prev,
                                        [reqId]: Math.max(0, currentQty - 1),
                                      }));
                                    }
                                  }}
                                  disabled={currentQty <= 0}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons
                                    name="remove"
                                    size={16}
                                    color={currentQty <= 0 ? "#94a3b8" : "#1e293b"}
                                  />
                                </TouchableOpacity>

                                <View style={styles.stepperDisplay}>
                                  <Text style={styles.stepperDisplayText}>{currentQty}</Text>
                                  <Text style={styles.stepperDisplaySub}>/ {req.quantity}</Text>
                                </View>

                                <TouchableOpacity
                                  style={[
                                    styles.stepperButton,
                                    currentQty >= inStock && styles.stepperButtonDisabled,
                                  ]}
                                  onPress={() => {
                                    if (currentQty < inStock) {
                                      setSelectedEquipQuantityMap((prev) => ({
                                        ...prev,
                                        [reqId]: currentQty + 1,
                                      }));
                                    } else {
                                      Alert.alert(
                                        "Stock Limit",
                                        `Warehouse only has ${inStock} unit(s) available in stock.`
                                      );
                                    }
                                  }}
                                  disabled={currentQty >= inStock}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons
                                    name="add"
                                    size={16}
                                    color={currentQty >= inStock ? "#94a3b8" : "#1e293b"}
                                  />
                                </TouchableOpacity>
                              </View>

                              {/* Quick Buttons */}
                              <View style={styles.quickButtonsRow}>
                                <TouchableOpacity
                                  style={[
                                    styles.quickSelectBtn,
                                    isComplete && styles.quickSelectBtnActive,
                                  ]}
                                  onPress={() => {
                                    const targetQty = Math.min(req.quantity, inStock);
                                    setSelectedEquipQuantityMap((prev) => ({
                                      ...prev,
                                      [reqId]: targetQty,
                                    }));
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <Ionicons
                                    name={isComplete ? "checkmark" : "flash-outline"}
                                    size={13}
                                    color={isComplete ? "#15803d" : "#475569"}
                                  />
                                  <Text
                                    style={[
                                      styles.quickSelectBtnText,
                                      isComplete && styles.quickSelectBtnTextActive,
                                    ]}
                                  >
                                    {isComplete
                                      ? "Fulfilled"
                                      : `Pick Req (${Math.min(req.quantity, inStock)})`}
                                  </Text>
                                </TouchableOpacity>

                                {currentQty > 0 && (
                                  <TouchableOpacity
                                    style={styles.clearBtn}
                                    onPress={() => {
                                      setSelectedEquipQuantityMap((prev) => ({
                                        ...prev,
                                        [reqId]: 0,
                                      }));
                                    }}
                                    activeOpacity={0.8}
                                  >
                                    <Ionicons name="close-circle-outline" size={13} color="#64748b" />
                                    <Text style={styles.clearBtnText}>Clear</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>

                            {/* Stock status banner */}
                            <View
                              style={[
                                styles.reasonBanner,
                                hasEnoughStock
                                  ? styles.reasonBannerAvailable
                                  : styles.reasonBannerDisabled,
                              ]}
                            >
                              <Ionicons
                                name={hasEnoughStock ? "checkmark-circle" : "alert-circle"}
                                size={14}
                                color={hasEnoughStock ? "#15803d" : "#b91c1c"}
                              />
                              <Text
                                style={[
                                  styles.reasonText,
                                  hasEnoughStock
                                    ? styles.reasonTextAvailable
                                    : styles.reasonTextDisabled,
                                ]}
                              >
                                {hasEnoughStock
                                  ? `${inStock} unit(s) available in inventory (Meets requirement of ${req.quantity}).`
                                  : `Only ${inStock} unit(s) in stock (Requirement needs ${req.quantity}).`}
                              </Text>
                            </View>
                          </View>
                        );
                      }

                      // B. INDIVIDUAL TRACKING TYPE (Instances)
                      const selectedIds = selectedEquipMap[reqId] || [];
                      const isComplete = selectedIds.length >= req.quantity;

                      // Filter equipment instances for this requirement
                      const candidateEquipments = allEquipments.filter((eq) => {
                        if (Number(eq.typeId) === Number(req.equipmentTypeId)) return true;
                        if (req.allowSubstitute) return true;
                        return false;
                      });

                      return (
                        <View key={reqId} style={styles.reqGroupCard}>
                          <View style={styles.reqGroupHeader}>
                            <View style={styles.reqGroupTitleWrap}>
                              <Text style={styles.reqGroupTitle}>
                                {req.equipmentTypeName || eqType?.name || `Equipment Type #${req.equipmentTypeId}`}
                              </Text>
                              <Text style={styles.reqGroupSubtitle}>
                                Required: {req.quantity} unit(s) • Tracking: Individual (Instances)
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.countBadge,
                                isComplete && styles.countBadgeComplete,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.countBadgeText,
                                  isComplete && styles.countBadgeTextComplete,
                                ]}
                              >
                                {selectedIds.length} / {req.quantity} Selected
                              </Text>
                            </View>
                          </View>

                          {candidateEquipments.length === 0 ? (
                            <Text style={styles.emptyListText}>
                              No matching equipment instances found in warehouse.
                            </Text>
                          ) : (
                            candidateEquipments.map((item) => {
                              const { eligible, reason } = evaluateEquipment(item, req);
                              const isSelected = selectedIds.includes(item.equipmentId);

                              return (
                                <TouchableOpacity
                                  key={item.equipmentId}
                                  style={[
                                    styles.resourceCard,
                                    isSelected && styles.resourceCardSelected,
                                    !eligible && styles.resourceCardDisabled,
                                  ]}
                                  onPress={() =>
                                    eligible &&
                                    toggleEquipment(reqId, item.equipmentId, req.quantity)
                                  }
                                  activeOpacity={eligible ? 0.75 : 1}
                                >
                                  <View style={styles.resourceCardTop}>
                                    <View style={styles.checkboxWrap}>
                                      <View
                                        style={[
                                          styles.customCheckbox,
                                          isSelected && styles.customCheckboxChecked,
                                          !eligible && styles.customCheckboxDisabled,
                                        ]}
                                      >
                                        {isSelected && (
                                          <Ionicons name="checkmark" size={14} color="#ffffff" />
                                        )}
                                      </View>
                                      <View style={styles.resourceMainInfo}>
                                        <Text style={styles.resourceName}>
                                          {item.equipmentName}
                                        </Text>
                                        <Text style={styles.resourceCode}>
                                          Code: {item.equipmentCode || `EQ-${item.equipmentId}`}
                                          {item.typeName &&
                                          item.typeName.toLowerCase().trim() !==
                                            item.equipmentName.toLowerCase().trim()
                                            ? ` • ${item.typeName}`
                                            : ""}
                                        </Text>
                                      </View>
                                    </View>
                                  </View>

                                  <View style={styles.resourceMetaRow}>
                                    {item.efficiencyScore ? (
                                      <View style={styles.metaChip}>
                                        <Ionicons name="speedometer-outline" size={12} color="#475569" />
                                        <Text style={styles.metaChipText}>
                                          Eff: {item.efficiencyScore}%
                                        </Text>
                                      </View>
                                    ) : null}
                                    <View style={styles.metaChip}>
                                      <Ionicons name="shield-outline" size={12} color="#475569" />
                                      <Text style={styles.metaChipText}>
                                        Status: {item.status || "Available"}
                                      </Text>
                                    </View>
                                  </View>

                                  <View
                                    style={[
                                      styles.reasonBanner,
                                      eligible
                                        ? styles.reasonBannerAvailable
                                        : styles.reasonBannerDisabled,
                                    ]}
                                  >
                                    <Ionicons
                                      name={eligible ? "checkmark-circle" : "alert-circle"}
                                      size={14}
                                      color={eligible ? "#15803d" : "#b91c1c"}
                                    />
                                    <Text
                                      style={[
                                        styles.reasonText,
                                        eligible
                                          ? styles.reasonTextAvailable
                                          : styles.reasonTextDisabled,
                                      ]}
                                    >
                                      {reason}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* 2. HUMAN RESOURCE TAB */}
              {activeTab === "human" && (
                <View style={{ gap: 16 }}>
                  {humanReqs.length === 0 ? (
                    <View style={styles.bannerCard}>
                      <Text style={styles.emptyListText}>
                        This experiment has no human resource requirements defined.
                      </Text>
                    </View>
                  ) : (
                    humanReqs.map((req, reqIdx) => {
                      const reqId = req.expHumanReqId || reqIdx;
                      const selectedIds = selectedHumanMap[reqId] || [];
                      const isComplete = selectedIds.length >= req.quantity;

                      return (
                        <View key={reqId} style={styles.reqGroupCard}>
                          <View style={styles.reqGroupHeader}>
                            <View style={styles.reqGroupTitleWrap}>
                              <Text style={styles.reqGroupTitle}>
                                {req.roleName || `Role #${req.roleId}`}
                              </Text>
                              <Text style={styles.reqGroupSubtitle}>
                                Needed: {req.quantity} person(s) •{" "}
                                {req.workingHoursPerDay || 8} hrs/day
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.countBadge,
                                isComplete && styles.countBadgeComplete,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.countBadgeText,
                                  isComplete && styles.countBadgeTextComplete,
                                ]}
                              >
                                {selectedIds.length} / {req.quantity} Assigned
                              </Text>
                            </View>
                          </View>

                          {allPersonnel.length === 0 ? (
                            <Text style={styles.emptyListText}>
                              No field personnel available.
                            </Text>
                          ) : (
                            allPersonnel.map((person) => {
                              const { eligible, reason } = evaluateHuman(person, req);
                              const isSelected = selectedIds.includes(person.humanResourceId);

                              return (
                                <TouchableOpacity
                                  key={person.humanResourceId}
                                  style={[
                                    styles.resourceCard,
                                    isSelected && styles.resourceCardSelected,
                                    !eligible && styles.resourceCardDisabled,
                                  ]}
                                  onPress={() =>
                                    eligible &&
                                    toggleHuman(reqId, person.humanResourceId, req.quantity)
                                  }
                                  activeOpacity={eligible ? 0.75 : 1}
                                >
                                  <View style={styles.resourceCardTop}>
                                    <View style={styles.checkboxWrap}>
                                      <View
                                        style={[
                                          styles.customCheckbox,
                                          isSelected && styles.customCheckboxChecked,
                                          !eligible && styles.customCheckboxDisabled,
                                        ]}
                                      >
                                        {isSelected && (
                                          <Ionicons name="checkmark" size={14} color="#ffffff" />
                                        )}
                                      </View>
                                      <View style={styles.resourceMainInfo}>
                                        <Text style={styles.resourceName}>
                                          {person.fullName || person.username || "Staff"}
                                        </Text>
                                        <Text style={styles.resourceCode}>
                                          Role: {person.roleName || "Personnel"}
                                          {person.email ? ` • ${person.email}` : ""}
                                        </Text>
                                      </View>
                                    </View>
                                  </View>

                                  <View style={styles.resourceMetaRow}>
                                    <View style={styles.metaChip}>
                                      <Ionicons name="time-outline" size={12} color="#475569" />
                                      <Text style={styles.metaChipText}>
                                        Workload: {person.currentWorkload}/
                                        {person.maxWorkingHoursPerDay}h
                                      </Text>
                                    </View>
                                    <View style={styles.metaChip}>
                                      <Ionicons name="radio-button-on" size={12} color="#475569" />
                                      <Text style={styles.metaChipText}>
                                        Status: {person.status}
                                      </Text>
                                    </View>
                                  </View>

                                  <View
                                    style={[
                                      styles.reasonBanner,
                                      eligible
                                        ? styles.reasonBannerAvailable
                                        : styles.reasonBannerDisabled,
                                    ]}
                                  >
                                    <Ionicons
                                      name={eligible ? "checkmark-circle" : "alert-circle"}
                                      size={14}
                                      color={eligible ? "#15803d" : "#b91c1c"}
                                    />
                                    <Text
                                      style={[
                                        styles.reasonText,
                                        eligible
                                          ? styles.reasonTextAvailable
                                          : styles.reasonTextDisabled,
                                      ]}
                                    >
                                      {reason}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* 3. LAND PLOT TAB */}
              {activeTab === "land" && (
                <View style={{ gap: 16 }}>
                  {landReqs.length === 0 ? (
                    <View style={styles.bannerCard}>
                      <Text style={styles.emptyListText}>
                        This experiment has no land requirements defined.
                      </Text>
                    </View>
                  ) : (
                    landReqs.map((req, reqIdx) => {
                      const reqId = req.expLandReqId || reqIdx;
                      const selectedIds = selectedLandMap[reqId] || [];
                      const isComplete = selectedIds.length > 0;

                      return (
                        <View key={reqId} style={styles.reqGroupCard}>
                          <View style={styles.reqGroupHeader}>
                            <View style={styles.reqGroupTitleWrap}>
                              <Text style={styles.reqGroupTitle}>
                                Forest Plot Requirement
                              </Text>
                              <Text style={styles.reqGroupSubtitle}>
                                Min Area: {req.requiredArea} m² • Soil:{" "}
                                {req.requiredSoilType || "Any soil type"}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.countBadge,
                                isComplete && styles.countBadgeComplete,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.countBadgeText,
                                  isComplete && styles.countBadgeTextComplete,
                                ]}
                              >
                                {isComplete ? "Plot Selected" : "Not Selected"}
                              </Text>
                            </View>
                          </View>

                          {allLands.length === 0 ? (
                            <Text style={styles.emptyListText}>
                              No land plots found in database.
                            </Text>
                          ) : (
                            allLands.map((land) => {
                              const { eligible, reason } = evaluateLand(land, req);
                              const isSelected = selectedIds.includes(land.landId);

                              return (
                                <TouchableOpacity
                                  key={land.landId}
                                  style={[
                                    styles.resourceCard,
                                    isSelected && styles.resourceCardSelected,
                                    !eligible && styles.resourceCardDisabled,
                                  ]}
                                  onPress={() => eligible && toggleLand(reqId, land.landId)}
                                  activeOpacity={eligible ? 0.75 : 1}
                                >
                                  <View style={styles.resourceCardTop}>
                                    <View style={styles.checkboxWrap}>
                                      <View
                                        style={[
                                          styles.customCheckbox,
                                          isSelected && styles.customCheckboxChecked,
                                          !eligible && styles.customCheckboxDisabled,
                                        ]}
                                      >
                                        {isSelected && (
                                          <Ionicons name="checkmark" size={14} color="#ffffff" />
                                        )}
                                      </View>
                                      <View style={styles.resourceMainInfo}>
                                        <Text style={styles.resourceName}>
                                          {land.landName || land.landCode || `Plot #${land.landId}`}
                                        </Text>
                                        <Text style={styles.resourceCode}>
                                          Code: {land.landCode || `LAND-${land.landId}`} • Area:{" "}
                                          {land.areaSize || land.area || 0} m²
                                        </Text>
                                      </View>
                                    </View>
                                  </View>

                                  <View style={styles.resourceMetaRow}>
                                    <View style={styles.metaChip}>
                                      <Ionicons name="earth" size={12} color="#475569" />
                                      <Text style={styles.metaChipText}>
                                        Soil: {land.soilType || "Standard"}
                                      </Text>
                                    </View>
                                    <View style={styles.metaChip}>
                                      <Ionicons name="location-outline" size={12} color="#475569" />
                                      <Text style={styles.metaChipText}>
                                        {land.location || "On-site"}
                                      </Text>
                                    </View>
                                  </View>

                                  <View
                                    style={[
                                      styles.reasonBanner,
                                      eligible
                                        ? styles.reasonBannerAvailable
                                        : styles.reasonBannerDisabled,
                                    ]}
                                  >
                                    <Ionicons
                                      name={eligible ? "checkmark-circle" : "alert-circle"}
                                      size={14}
                                      color={eligible ? "#15803d" : "#b91c1c"}
                                    />
                                    <Text
                                      style={[
                                        styles.reasonText,
                                        eligible
                                          ? styles.reasonTextAvailable
                                          : styles.reasonTextDisabled,
                                      ]}
                                    >
                                      {reason}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View
          style={[
            styles.footerActionBar,
            { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 14 },
          ]}
        >
          {/* AI Optimize Button */}
          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => setAiModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={17} color="#ffffff" />
            <Text style={styles.aiBtnText}>AI Optimize (GA Solver)</Text>
          </TouchableOpacity>

          {/* Manual Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmitManual}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={16} color="#ffffff" />
                <Text style={styles.submitBtnText}>Submit Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* AI Solver Modal Integration */}
        <AISuggestionModal
          visible={aiModalVisible}
          experiment={experiment}
          onClose={() => setAiModalVisible(false)}
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
