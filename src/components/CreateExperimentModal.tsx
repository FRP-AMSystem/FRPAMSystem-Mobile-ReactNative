import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/colors";
import { useAuth } from "../context/AuthContext";
import { createExperiment, getExperiments } from "../api/experimentApi";
import { createExperimentPhase } from "../api/experimentPhaseApi";
import {
  createExperimentEquipmentRequirement,
  createExperimentHumanRequirement,
  createExperimentLandRequirement,
} from "../api/experimentRequirementApi";
import { getEquipmentTypes, EquipmentTypeItem } from "../api/equipmentTypeApi";
import { getSkills } from "../api/skillApi";
import { getAllSoilTypes } from "../api/landApi";
import { getRoles } from "../api/roleApi";
import { SkillItem } from "../types/skill";
import { RoleItem } from "../types/role";
import { DatePickerModal } from "./DatePickerModal";
import { styles } from "./CreateExperimentModal.styles";

interface CreateExperimentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PhaseFormItem {
  id: string;
  phaseName: string;
  phaseDescription: string;
  phaseOrder: number;
  expectedStartDate: string;
  expectedEndDate: string;
}

interface EquipmentReqFormItem {
  id: string;
  phaseId: string;
  phaseName: string;
  equipmentTypeId: number;
  equipmentTypeName: string;
  quantity: number;
  minAcceptableEfficiency: number;
  allowSubstitute: boolean;
  note: string;
}

interface HumanReqFormItem {
  id: string;
  phaseId: string;
  phaseName: string;
  roleId: number;
  roleName: string;
  quantity: number;
  requiredSkillId: number | null;
  requiredSkillName?: string;
  workingHoursPerDay: number;
  note: string;
}

interface LandReqFormItem {
  id: string;
  requiredArea: number;
  requiredSoilType: string;
  note: string;
}

const PRIORITY_OPTIONS = [
  { value: "0", label: "Low" },
  { value: "1", label: "Medium" },
  { value: "2", label: "High" },
  { value: "3", label: "Urgent" },
];

export function CreateExperimentModal({
  visible,
  onClose,
  onSuccess,
}: CreateExperimentModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // External reference data
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentTypeItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [soilTypes, setSoilTypes] = useState<string[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);

  // Step 1: General Info
  const [experimentName, setExperimentName] = useState("");
  const [priority, setPriority] = useState("1");
  const [expectStartDate, setExpectStartDate] = useState("");
  const [expectEndDate, setExpectEndDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Phases
  const [phases, setPhases] = useState<PhaseFormItem[]>([]);

  // Step 3: Equipment Reqs
  const [activePhaseId, setActivePhaseId] = useState<string>("");
  const [equipmentReqs, setEquipmentReqs] = useState<EquipmentReqFormItem[]>([]);

  // Step 4: Human Reqs
  const [humanReqs, setHumanReqs] = useState<HumanReqFormItem[]>([]);

  // Step 5: Land Reqs
  const [landReqs, setLandReqs] = useState<LandReqFormItem[]>([]);

  // DatePicker state
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<string>("");
  const [datePickerTitle, setDatePickerTitle] = useState("");
  const [datePickerMin, setDatePickerMin] = useState<string | undefined>(undefined);
  const [datePickerMax, setDatePickerMax] = useState<string | undefined>(undefined);
  const [datePickerCurrentVal, setDatePickerCurrentVal] = useState<string>("");

  useEffect(() => {
    if (visible) {
      loadReferenceData();
      resetForm();
    }
  }, [visible]);

  const loadReferenceData = async () => {
    try {
      const [eqs, sks, soils, rls] = await Promise.all([
        getEquipmentTypes().catch(() => []),
        getSkills().catch(() => []),
        getAllSoilTypes().catch(() => []),
        getRoles().catch(() => []),
      ]);
      setEquipmentTypes(eqs);
      setSkills(sks);
      setSoilTypes(soils);
      const fieldRoles = rls.filter((r) => {
        const name = (r.roleName || "").toLowerCase();
        return name.includes("technician") || name.includes("seasonal");
      });
      const fallbackRoles: RoleItem[] = [
        { roleId: 3, roleName: "Technician", name: "Technician", description: "" },
        { roleId: 4, roleName: "Seasonal", name: "Seasonal Worker", description: "" },
      ];
      setRoles(fieldRoles.length > 0 ? fieldRoles : fallbackRoles);
    } catch (err) {
      console.error("Load reference data error:", err);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setError("");
    setSaving(false);
    setExperimentName("");
    setPriority("1");
    setExpectStartDate("");
    setExpectEndDate("");
    setDeadline("");
    setDescription("");
    setPhases([]);
    setEquipmentReqs([]);
    setHumanReqs([]);
    setLandReqs([]);
    setActivePhaseId("");
  };

  // Date picker opener helper
  const openDatePicker = (
    target: string,
    title: string,
    currentValue: string,
    min?: string,
    max?: string
  ) => {
    setDatePickerTarget(target);
    setDatePickerTitle(title);
    setDatePickerCurrentVal(currentValue);
    setDatePickerMin(min);
    setDatePickerMax(max);
    setDatePickerVisible(true);
  };

  const handleDateSelected = (selectedDate: string) => {
    if (datePickerTarget === "expectStartDate") {
      setExpectStartDate(selectedDate);
      if (expectEndDate && expectEndDate < selectedDate) setExpectEndDate("");
      if (deadline && deadline < selectedDate) setDeadline("");
    } else if (datePickerTarget === "expectEndDate") {
      setExpectEndDate(selectedDate);
      if (expectStartDate && expectStartDate > selectedDate) setExpectStartDate("");
      if (deadline && deadline < selectedDate) setDeadline("");
    } else if (datePickerTarget === "deadline") {
      setDeadline(selectedDate);
    } else if (datePickerTarget.startsWith("phase-start-")) {
      const pId = datePickerTarget.replace("phase-start-", "");
      setPhases((prev) =>
        prev.map((p) => (p.id === pId ? { ...p, expectedStartDate: selectedDate } : p))
      );
    } else if (datePickerTarget.startsWith("phase-end-")) {
      const pId = datePickerTarget.replace("phase-end-", "");
      setPhases((prev) =>
        prev.map((p) => (p.id === pId ? { ...p, expectedEndDate: selectedDate } : p))
      );
    }
  };

  // Step 2: Phase handlers
  const handleAddPhase = () => {
    const nextOrder = phases.length + 1;
    const newPhase: PhaseFormItem = {
      id: `phase-${Date.now()}-${Math.random()}`,
      phaseName: `Phase ${nextOrder}`,
      phaseDescription: "",
      phaseOrder: nextOrder,
      expectedStartDate: expectStartDate || new Date().toISOString().slice(0, 10),
      expectedEndDate: expectEndDate || new Date().toISOString().slice(0, 10),
    };
    const nextList = [...phases, newPhase];
    setPhases(nextList);
    if (!activePhaseId) setActivePhaseId(newPhase.id);
  };

  const handleRemovePhase = (id: string) => {
    const filtered = phases
      .filter((p) => p.id !== id)
      .map((p, idx) => ({ ...p, phaseOrder: idx + 1 }));
    setPhases(filtered);
    if (activePhaseId === id) {
      setActivePhaseId(filtered[0]?.id || "");
    }
  };

  // Step 3: Equipment Reqs handlers
  const handleAddEquipmentReq = () => {
    const curPhase = phases.find((p) => p.id === activePhaseId) || phases[0];
    const firstType = equipmentTypes[0];
    const newReq: EquipmentReqFormItem = {
      id: `eq-req-${Date.now()}-${Math.random()}`,
      phaseId: curPhase?.id || "",
      phaseName: curPhase?.phaseName || "Phase 1",
      equipmentTypeId: firstType ? firstType.equipmentTypeId : 1,
      equipmentTypeName: firstType ? firstType.name : "Equipment",
      quantity: 1,
      minAcceptableEfficiency: 80,
      allowSubstitute: true,
      note: "",
    };
    setEquipmentReqs((prev) => [...prev, newReq]);
  };

  const handleRemoveEquipmentReq = (id: string) => {
    setEquipmentReqs((prev) => prev.filter((r) => r.id !== id));
  };

  // Step 4: Human Reqs handlers
  const handleAddHumanReq = () => {
    const curPhase = phases.find((p) => p.id === activePhaseId) || phases[0];
    const defaultRole =
      roles.find((r) => r.roleName.toLowerCase().includes("technician")) ||
      roles[0] || { roleId: 3, roleName: "Technician" };
    const newReq: HumanReqFormItem = {
      id: `hu-req-${Date.now()}-${Math.random()}`,
      phaseId: curPhase?.id || "",
      phaseName: curPhase?.phaseName || "Phase 1",
      roleId: defaultRole.roleId,
      roleName: defaultRole.roleName,
      quantity: 1,
      requiredSkillId: null,
      workingHoursPerDay: 8,
      note: "",
    };
    setHumanReqs((prev) => [...prev, newReq]);
  };

  const handleRemoveHumanReq = (id: string) => {
    setHumanReqs((prev) => prev.filter((r) => r.id !== id));
  };

  // Step 5: Land Reqs handlers
  const handleAddLandReq = () => {
    if (landReqs.length >= 1) {
      Alert.alert("Notice", "Each experiment requires at most 1 land plot.");
      return;
    }
    const newReq: LandReqFormItem = {
      id: `land-req-${Date.now()}`,
      requiredArea: 500,
      requiredSoilType: soilTypes[0] || "Red Basalt Soil",
      note: "",
    };
    setLandReqs([newReq]);
  };

  const handleRemoveLandReq = () => {
    setLandReqs([]);
  };

  // Validation logic per step
  const validateStepData = (step: number): string | null => {
    if (step === 1) {
      if (!experimentName.trim()) {
        return "[Step 1 - Info] Please enter experiment name.";
      }
      if (experimentName.trim().length < 3) {
        return "[Step 1 - Info] Experiment name must be at least 3 characters long.";
      }
      if (!expectStartDate) {
        return "[Step 1 - Info] Please select expected start date.";
      }
      if (!expectEndDate) {
        return "[Step 1 - Info] Please select expected end date.";
      }
      if (expectStartDate > expectEndDate) {
        return "[Step 1 - Info] Expected end date must be on or after expected start date.";
      }
      if (deadline && deadline < expectEndDate) {
        return "[Step 1 - Info] Report deadline must be on or after expected end date.";
      }
    } else if (step === 2) {
      if (phases.length === 0) {
        return "[Step 2 - Phases] Please add at least 1 experiment phase.";
      }
      for (let i = 0; i < phases.length; i++) {
        const p = phases[i];
        if (!p.phaseName.trim()) {
          return `[Step 2 - Phases] Phase #${i + 1}: Phase name cannot be empty.`;
        }
        if (!p.expectedStartDate) {
          return `[Step 2 - Phases] Phase #${i + 1} (${p.phaseName}): Start date is required.`;
        }
        if (!p.expectedEndDate) {
          return `[Step 2 - Phases] Phase #${i + 1} (${p.phaseName}): End date is required.`;
        }
        if (p.expectedStartDate > p.expectedEndDate) {
          return `[Step 2 - Phases] Phase #${i + 1} (${p.phaseName}): End date must be on or after start date.`;
        }
      }
    } else if (step === 3) {
      for (let i = 0; i < equipmentReqs.length; i++) {
        const eq = equipmentReqs[i];
        if (!eq.quantity || eq.quantity < 1) {
          return `[Step 3 - Equipment] Equipment requirement #${i + 1}: Quantity must be at least 1 unit.`;
        }
        if (eq.minAcceptableEfficiency < 0 || eq.minAcceptableEfficiency > 100) {
          return `[Step 3 - Equipment] Equipment requirement #${i + 1}: Minimum efficiency must be between 0% and 100%.`;
        }
      }
    } else if (step === 4) {
      for (let i = 0; i < humanReqs.length; i++) {
        const hu = humanReqs[i];
        if (!hu.quantity || hu.quantity < 1) {
          return `[Step 4 - Personnel] Personnel requirement #${i + 1}: Headcount must be at least 1.`;
        }
        if (!hu.workingHoursPerDay || hu.workingHoursPerDay < 1 || hu.workingHoursPerDay > 24) {
          return `[Step 4 - Personnel] Personnel requirement #${i + 1}: Working hours per day must be between 1 and 24.`;
        }
      }
    } else if (step === 5) {
      for (let i = 0; i < landReqs.length; i++) {
        const land = landReqs[i];
        if (!land.requiredArea || land.requiredArea <= 0) {
          return `[Step 5 - Land] Land requirement: Required Area must be greater than 0 m².`;
        }
        if (!land.requiredSoilType) {
          return `[Step 5 - Land] Land requirement: Please select a soil type.`;
        }
      }
    }
    return null;
  };

  const validateAllSteps = (): { step: number; message: string } | null => {
    for (let s = 1; s <= 5; s++) {
      const err = validateStepData(s);
      if (err) {
        return { step: s, message: err };
      }
    }
    return null;
  };

  // Stepper logic
  const handleJumpToStep = (targetStep: number) => {
    setError("");
    if (targetStep > currentStep) {
      for (let s = 1; s < targetStep; s++) {
        const stepErr = validateStepData(s);
        if (stepErr) {
          setError(stepErr);
          setCurrentStep(s);
          scrollRef.current?.scrollTo({ y: 0, animated: true });
          return;
        }
      }
    }
    setCurrentStep(targetStep);
  };

  const handleNextStep = () => {
    setError("");

    const err = validateStepData(currentStep);
    if (err) {
      setError(err);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (currentStep === 1 && phases.length === 0) {
      // Auto create 1 default phase if none exists
      const defaultPhase: PhaseFormItem = {
        id: `phase-${Date.now()}`,
        phaseName: "Phase 1: Preparation & Setup",
        phaseDescription: "Field preparation and trial layout",
        phaseOrder: 1,
        expectedStartDate: expectStartDate || new Date().toISOString().slice(0, 10),
        expectedEndDate: expectEndDate || new Date().toISOString().slice(0, 10),
      };
      setPhases([defaultPhase]);
      setActivePhaseId(defaultPhase.id);
    }

    if (currentStep === 2 && phases.length > 0 && !activePhaseId) {
      setActivePhaseId(phases[0].id);
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setError("");
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Submit Plan Flow
  const handleSavePlan = async () => {
    setError("");

    // Validate all 5 steps first and jump to the failing step immediately
    const valRes = validateAllSteps();
    if (valRes) {
      setError(valRes.message);
      setCurrentStep(valRes.step);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    const trimmedName = experimentName.trim();
    setSaving(true);
    try {
      // 1. Check duplicate name
      try {
        const existingList = await getExperiments({ Keyword: trimmedName, Size: 20 });
        const isDuplicate = existingList.some(
          (item) => item.experimentName?.toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
          setError(`[Step 1 - Info] Experiment name "${trimmedName}" already exists. Please choose a different name.`);
          setSaving(false);
          setCurrentStep(1);
          scrollRef.current?.scrollTo({ y: 0, animated: true });
          return;
        }
      } catch (checkErr) {
        console.warn("Check duplicate error:", checkErr);
      }

      // 2. Create Experiment (Draft)
      const sanitizeIsoDate = (d?: string | null) => {
        if (!d) return `${new Date().toISOString().slice(0, 10)}T00:00:00`;
        return `${d.slice(0, 10)}T00:00:00`;
      };

      const expPayload: any = {
        experimentName: trimmedName,
        description: description.trim() || null,
        researcherId: user?.userId || 1,
        expectStartDate: sanitizeIsoDate(expectStartDate),
        expectEndDate: sanitizeIsoDate(expectEndDate),
        deadline: sanitizeIsoDate(deadline || expectEndDate),
        priority: Number(priority) || 1,
        status: "Draft",
      };

      const createdExp = await createExperiment(expPayload);
      const expId = createdExp.experimentId;

      // 3. Create Phases
      for (const phase of phases) {
        try {
          await createExperimentPhase({
            experimentId: expId,
            phaseName: phase.phaseName,
            phaseDescription: phase.phaseDescription || null,
            phaseOrder: phase.phaseOrder,
            expectedStartDate: sanitizeIsoDate(phase.expectedStartDate),
            expectedEndDate: sanitizeIsoDate(phase.expectedEndDate),
            status: "Planned",
          });
        } catch (phaseErr) {
          console.warn("Create phase failed:", phaseErr);
        }
      }

      // 4. Create Equipment Requirements
      for (const eq of equipmentReqs) {
        try {
          await createExperimentEquipmentRequirement({
            experimentId: expId,
            equipmentTypeId: eq.equipmentTypeId,
            quantity: eq.quantity,
            allowSubstitute: eq.allowSubstitute,
            minAcceptableEfficiency: eq.minAcceptableEfficiency,
            note: eq.note || null,
          });
        } catch (eqErr) {
          console.warn("Create equipment requirement failed:", eqErr);
        }
      }

      // 5. Create Human Requirements
      for (const hu of humanReqs) {
        try {
          await createExperimentHumanRequirement({
            experimentId: expId,
            roleId: hu.roleId,
            quantity: hu.quantity,
            requiredSkillId: hu.requiredSkillId,
            workingHoursPerDay: hu.workingHoursPerDay,
            note: hu.note || null,
          });
        } catch (huErr) {
          console.warn("Create human requirement failed:", huErr);
        }
      }

      // 6. Create Land Requirement
      if (landReqs.length > 0) {
        const land = landReqs[0];
        try {
          await createExperimentLandRequirement({
            experimentId: expId,
            requiredArea: land.requiredArea,
            requiredSoilType: land.requiredSoilType,
            note: land.note || null,
          });
        } catch (landErr) {
          console.warn("Create land requirement failed:", landErr);
        }
      }

      Alert.alert(
        "Experiment Created",
        `Experiment "${trimmedName}" has been saved as Draft with all phases and resource requirements.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Create experiment wizard failed:", err);
      let detailedMsg = "";

      if (err?.response?.data?.errors && typeof err.response.data.errors === "object") {
        const messages: string[] = [];
        Object.entries(err.response.data.errors).forEach(([field, msgs]) => {
          if (Array.isArray(msgs)) {
            messages.push(`${field}: ${msgs.join(", ")}`);
          } else if (msgs) {
            messages.push(`${field}: ${String(msgs)}`);
          }
        });
        if (messages.length > 0) detailedMsg = messages.join("\n");
      }

      if (!detailedMsg) {
        detailedMsg =
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.response?.data?.title ||
          (typeof err?.response?.data === "string" ? err.response.data : "") ||
          (err?.response?.status === 500
            ? "Server error (500): Could not process experiment. Please verify all information and try again."
            : err?.message || "Failed to save experiment. Please verify all information.");
      }

      setError(detailedMsg);

      // Auto-jump to the step where error likely occurred
      const lower = detailedMsg.toLowerCase();
      if (lower.includes("phase")) {
        setCurrentStep(2);
      } else if (lower.includes("equipment")) {
        setCurrentStep(3);
      } else if (
        lower.includes("human") ||
        lower.includes("personnel") ||
        lower.includes("role") ||
        lower.includes("skill")
      ) {
        setCurrentStep(4);
      } else if (
        lower.includes("land") ||
        lower.includes("soil") ||
        lower.includes("area")
      ) {
        setCurrentStep(5);
      } else {
        setCurrentStep(1);
      }
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setSaving(false);
    }
  };

  const curActivePhase = phases.find((p) => p.id === activePhaseId) || phases[0];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView
        style={[
          styles.fullContainer,
          { paddingTop: insets.top > 0 ? insets.top : 8 },
        ]}
        edges={["top", "left", "right"]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerTitleGroup}>
                <Text style={styles.headerTag}>EXPERIMENT PLANNING</Text>
                <Text style={styles.headerTitle}>Create New Experiment</Text>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Stepper Indicator */}
            <View style={styles.stepperContainer}>
              {[
                { step: 1, label: "Info" },
                { step: 2, label: "Phases" },
                { step: 3, label: "Equipment" },
                { step: 4, label: "Personnel" },
                { step: 5, label: "Land" },
              ].map((s, idx) => {
                const isActive = currentStep === s.step;
                const isCompleted = currentStep > s.step;

                return (
                  <React.Fragment key={s.step}>
                    <TouchableOpacity
                      style={styles.stepItem}
                      onPress={() => handleJumpToStep(s.step)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.stepCircle,
                          isActive && styles.stepCircleActive,
                          isCompleted && styles.stepCircleCompleted,
                        ]}
                      >
                        {isCompleted ? (
                          <Ionicons name="checkmark" size={14} color="#ffffff" />
                        ) : (
                          <Text
                            style={[
                              styles.stepNumber,
                              (isActive || isCompleted) && styles.stepNumberActive,
                            ]}
                          >
                            {s.step}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>

                    {idx < 4 ? (
                      <View
                        style={[
                          styles.stepLine,
                          currentStep > idx + 1 && styles.stepLineActive,
                        ]}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Step Content */}
          <ScrollView
            ref={scrollRef}
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* STEP 1: General Info */}
            {currentStep === 1 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="information-circle" size={20} color={Colors.primary} />
                    <View style={styles.cardTitleContainer}>
                      <Text style={styles.cardTitle}>Step 1: General Info</Text>
                      <Text style={styles.cardSubtitle}>
                        Research objectives and trial timeline
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Experiment Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Research Experiment Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Pine forest soil quality assessment 2026..."
                    placeholderTextColor="#94a3b8"
                    value={experimentName}
                    onChangeText={setExperimentName}
                  />
                </View>

                {/* Priority */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Priority Level</Text>
                  <View style={styles.prioritySelector}>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.priorityBtn,
                          priority === opt.value && styles.priorityBtnActive,
                        ]}
                        onPress={() => setPriority(opt.value)}
                      >
                        <Text
                          style={[
                            styles.priorityText,
                            priority === opt.value && styles.priorityTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Start Date */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Expected Start Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() =>
                      openDatePicker(
                        "expectStartDate",
                        "Select Start Date",
                        expectStartDate,
                        new Date().toISOString().slice(0, 10),
                        expectEndDate || deadline || undefined
                      )
                    }
                  >
                    <Text
                      style={
                        expectStartDate ? styles.datePickerValue : styles.datePickerPlaceholder
                      }
                    >
                      {expectStartDate || "Select start date"}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* End Date */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Expected End Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() =>
                      openDatePicker(
                        "expectEndDate",
                        "Select End Date",
                        expectEndDate,
                        expectStartDate || new Date().toISOString().slice(0, 10),
                        deadline || undefined
                      )
                    }
                  >
                    <Text
                      style={
                        expectEndDate ? styles.datePickerValue : styles.datePickerPlaceholder
                      }
                    >
                      {expectEndDate || "Select end date"}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Deadline */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Report Deadline</Text>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() =>
                      openDatePicker(
                        "deadline",
                        "Select Report Deadline",
                        deadline,
                        expectEndDate || expectStartDate || new Date().toISOString().slice(0, 10)
                      )
                    }
                  >
                    <Text
                      style={deadline ? styles.datePickerValue : styles.datePickerPlaceholder}
                    >
                      {deadline || "Select deadline"}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Description */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Description & Objectives</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Describe research methodology, objectives, and expected outcomes..."
                    placeholderTextColor="#94a3b8"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>
              </View>
            )}

            {/* STEP 2: Phases */}
            {currentStep === 2 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="layers" size={20} color={Colors.primary} />
                    <View style={styles.cardTitleContainer}>
                      <Text style={styles.cardTitle}>Step 2: Experiment Phases</Text>
                      <Text style={styles.cardSubtitle}>
                        Divide progress into sequential phases
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.addBtn} onPress={handleAddPhase} activeOpacity={0.8}>
                    <Ionicons name="add" size={16} color={Colors.primary} />
                    <Text style={styles.addBtnText}>Add Phase</Text>
                  </TouchableOpacity>
                </View>

                {phases.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="layers-outline" size={36} color="#94a3b8" />
                    <Text style={styles.emptyBoxText}>No phases added yet</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddPhase}>
                      <Text style={styles.addBtnText}>+ Add First Phase</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  phases.map((phase, idx) => (
                    <View key={phase.id} style={styles.itemRowCard}>
                      <View style={styles.itemRowTop}>
                        <View style={styles.itemBadge}>
                          <Text style={styles.itemBadgeText}>Phase #{idx + 1}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => handleRemovePhase(phase.id)}
                        >
                          <Ionicons name="trash-outline" size={15} color="#dc2626" />
                        </TouchableOpacity>
                      </View>

                      {/* Phase Name */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Phase Name</Text>
                        <TextInput
                          style={styles.input}
                          value={phase.phaseName}
                          onChangeText={(val) =>
                            setPhases((prev) =>
                              prev.map((p) => (p.id === phase.id ? { ...p, phaseName: val } : p))
                            )
                          }
                          placeholder="e.g. Field preparation & soil sampling"
                        />
                      </View>

                      {/* Dates */}
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                          <Text style={styles.fieldLabel}>Start</Text>
                          <TouchableOpacity
                            style={styles.datePickerBtn}
                            onPress={() =>
                              openDatePicker(
                                `phase-start-${phase.id}`,
                                "Phase Start Date",
                                phase.expectedStartDate,
                                expectStartDate || undefined,
                                phase.expectedEndDate || expectEndDate || undefined
                              )
                            }
                          >
                            <Text style={styles.datePickerValue}>
                              {phase.expectedStartDate || "Select date"}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                          <Text style={styles.fieldLabel}>End</Text>
                          <TouchableOpacity
                            style={styles.datePickerBtn}
                            onPress={() =>
                              openDatePicker(
                                `phase-end-${phase.id}`,
                                "Phase End Date",
                                phase.expectedEndDate,
                                phase.expectedStartDate || expectStartDate || undefined,
                                expectEndDate || undefined
                              )
                            }
                          >
                            <Text style={styles.datePickerValue}>
                              {phase.expectedEndDate || "Select date"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Description */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Phase Description</Text>
                        <TextInput
                          style={styles.input}
                          value={phase.phaseDescription}
                          onChangeText={(val) =>
                            setPhases((prev) =>
                              prev.map((p) =>
                                p.id === phase.id ? { ...p, phaseDescription: val } : p
                              )
                            )
                          }
                          placeholder="Key activities in this phase..."
                        />
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* STEP 3: Equipment Requirements */}
            {currentStep === 3 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="construct" size={20} color="#d97706" />
                    <View style={styles.cardTitleContainer}>
                      <Text style={styles.cardTitle}>Step 3: Equipment Requirements</Text>
                      <Text style={styles.cardSubtitle}>
                        Specify machinery and tools needed for each phase
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={handleAddEquipmentReq}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary} />
                    <Text style={styles.addBtnText}>Add Equipment</Text>
                  </TouchableOpacity>
                </View>

                {/* Phase Selection Chips */}
                {phases.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.phaseChipsScroll}
                  >
                    {phases.map((p) => {
                      const isActive = p.id === activePhaseId;
                      const count = equipmentReqs.filter(
                        (r) => r.phaseId === p.id || (!r.phaseId && p.id === phases[0].id)
                      ).length;

                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.phaseChip, isActive && styles.phaseChipActive]}
                          onPress={() => setActivePhaseId(p.id)}
                        >
                          <Text
                            style={[styles.phaseChipText, isActive && styles.phaseChipTextActive]}
                          >
                            {p.phaseName}
                          </Text>
                          <View
                            style={[
                              styles.phaseChipBadge,
                              isActive && styles.phaseChipBadgeActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.phaseChipBadgeText,
                                isActive && styles.phaseChipBadgeTextActive,
                              ]}
                            >
                              {count}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : null}

                {equipmentReqs.filter(
                  (r) =>
                    r.phaseId === activePhaseId ||
                    (!r.phaseId && activePhaseId === phases[0]?.id)
                ).length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="construct-outline" size={36} color="#94a3b8" />
                    <Text style={styles.emptyBoxText}>
                      No equipment requirements for {curActivePhase?.phaseName || "this phase"}
                    </Text>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddEquipmentReq}>
                      <Text style={styles.addBtnText}>+ Add Required Equipment</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  equipmentReqs
                    .filter(
                      (r) =>
                        r.phaseId === activePhaseId ||
                        (!r.phaseId && activePhaseId === phases[0]?.id)
                    )
                    .map((req, idx) => (
                      <View key={req.id} style={styles.itemRowCard}>
                        <View style={styles.itemRowTop}>
                          <View style={styles.itemBadge}>
                            <Text style={styles.itemBadgeText}>
                              [{curActivePhase?.phaseName || "Phase"}] Equipment #{idx + 1}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => handleRemoveEquipmentReq(req.id)}
                          >
                            <Ionicons name="trash-outline" size={15} color="#dc2626" />
                          </TouchableOpacity>
                        </View>

                        {/* Equipment Type Selector */}
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>
                            Equipment Type <Text style={styles.requiredStar}>*</Text>
                          </Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.optionPillRow}
                          >
                            {equipmentTypes.map((t) => {
                              const isSel = req.equipmentTypeId === t.equipmentTypeId;
                              return (
                                <TouchableOpacity
                                  key={t.equipmentTypeId}
                                  style={[styles.optionPill, isSel && styles.optionPillActive]}
                                  onPress={() =>
                                    setEquipmentReqs((prev) =>
                                      prev.map((r) =>
                                        r.id === req.id
                                          ? {
                                              ...r,
                                              equipmentTypeId: t.equipmentTypeId,
                                              equipmentTypeName: t.name,
                                            }
                                          : r
                                      )
                                    )
                                  }
                                >
                                  <Text
                                    style={[
                                      styles.optionPillText,
                                      isSel && styles.optionPillTextActive,
                                    ]}
                                  >
                                    {t.name}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>

                        {/* Quantity & Min Efficiency */}
                        <View style={{ flexDirection: "row", gap: 10 }}>
                          <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>Quantity (units)</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="numeric"
                              value={String(req.quantity)}
                              onChangeText={(val) =>
                                setEquipmentReqs((prev) =>
                                  prev.map((r) =>
                                    r.id === req.id
                                      ? { ...r, quantity: Math.max(1, parseInt(val, 10) || 1) }
                                      : r
                                  )
                                )
                              }
                            />
                          </View>

                          <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>Minimum Efficiency (%)</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="numeric"
                              value={String(req.minAcceptableEfficiency)}
                              onChangeText={(val) =>
                                setEquipmentReqs((prev) =>
                                  prev.map((r) =>
                                    r.id === req.id
                                      ? {
                                          ...r,
                                          minAcceptableEfficiency: Math.min(
                                            100,
                                            Math.max(0, parseInt(val, 10) || 0)
                                          ),
                                        }
                                      : r
                                  )
                                )
                              }
                            />
                          </View>
                        </View>

                        {/* Allow Substitute */}
                        <TouchableOpacity
                          style={styles.checkboxRow}
                          onPress={() =>
                            setEquipmentReqs((prev) =>
                              prev.map((r) =>
                                r.id === req.id
                                  ? { ...r, allowSubstitute: !r.allowSubstitute }
                                  : r
                              )
                            )
                          }
                        >
                          <View
                            style={[
                              styles.checkbox,
                              req.allowSubstitute && styles.checkboxChecked,
                            ]}
                          >
                            {req.allowSubstitute ? (
                              <Ionicons name="checkmark" size={14} color="#ffffff" />
                            ) : null}
                          </View>
                          <Text style={styles.checkboxLabel}>
                            Allow substitute equipment if primary unavailable
                          </Text>
                        </TouchableOpacity>

                        {/* Note */}
                        <View style={[styles.fieldGroup, { marginTop: 8 }]}>
                          <Text style={styles.fieldLabel}>Technical Notes</Text>
                          <TextInput
                            style={styles.input}
                            value={req.note}
                            onChangeText={(val) =>
                              setEquipmentReqs((prev) =>
                                prev.map((r) => (r.id === req.id ? { ...r, note: val } : r))
                              )
                            }
                            placeholder="e.g. Requires GPS sensor attachment..."
                          />
                        </View>
                      </View>
                    ))
                )}
              </View>
            )}

            {/* STEP 4: Human Requirements */}
            {currentStep === 4 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="people" size={20} color="#9333ea" />
                    <View style={styles.cardTitleContainer}>
                      <Text style={styles.cardTitle}>Step 4: Personnel Requirements</Text>
                      <Text style={styles.cardSubtitle}>
                        Assign roles (Technician / Seasonal) and required skills
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={handleAddHumanReq}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary} />
                    <Text style={styles.addBtnText}>Add Personnel</Text>
                  </TouchableOpacity>
                </View>

                {/* Phase Selection Chips */}
                {phases.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.phaseChipsScroll}
                  >
                    {phases.map((p) => {
                      const isActive = p.id === activePhaseId;
                      const count = humanReqs.filter(
                        (r) => r.phaseId === p.id || (!r.phaseId && p.id === phases[0].id)
                      ).length;

                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.phaseChip, isActive && styles.phaseChipActive]}
                          onPress={() => setActivePhaseId(p.id)}
                        >
                          <Text
                            style={[styles.phaseChipText, isActive && styles.phaseChipTextActive]}
                          >
                            {p.phaseName}
                          </Text>
                          <View
                            style={[
                              styles.phaseChipBadge,
                              isActive && styles.phaseChipBadgeActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.phaseChipBadgeText,
                                isActive && styles.phaseChipBadgeTextActive,
                              ]}
                            >
                              {count}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : null}

                {humanReqs.filter(
                  (r) =>
                    r.phaseId === activePhaseId ||
                    (!r.phaseId && activePhaseId === phases[0]?.id)
                ).length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="people-outline" size={36} color="#94a3b8" />
                    <Text style={styles.emptyBoxText}>
                      No personnel requirements for {curActivePhase?.phaseName || "this phase"}
                    </Text>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddHumanReq}>
                      <Text style={styles.addBtnText}>+ Add Personnel Requirement</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  humanReqs
                    .filter(
                      (r) =>
                        r.phaseId === activePhaseId ||
                        (!r.phaseId && activePhaseId === phases[0]?.id)
                    )
                    .map((req, idx) => (
                      <View key={req.id} style={styles.itemRowCard}>
                        <View style={styles.itemRowTop}>
                          <View style={styles.itemBadge}>
                            <Text style={styles.itemBadgeText}>
                              [{curActivePhase?.phaseName || "Phase"}] Personnel #{idx + 1}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => handleRemoveHumanReq(req.id)}
                          >
                            <Ionicons name="trash-outline" size={15} color="#dc2626" />
                          </TouchableOpacity>
                        </View>

                        {/* Role selection */}
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>Assigned Role</Text>
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                            {roles
                              .filter((r) => {
                                const name = (r.roleName || "").toLowerCase();
                                return name.includes("technician") || name.includes("seasonal");
                              })
                              .map((r) => {
                                const isSel = req.roleId === r.roleId;
                                const isTech = r.roleName.toLowerCase().includes("tech");
                                const roleLabel = isTech ? "Technician" : "Seasonal Worker";
                                return (
                                  <TouchableOpacity
                                    key={r.roleId}
                                    style={[
                                      styles.optionPill,
                                      { flex: 1, minWidth: 120, alignItems: "center" },
                                      isSel && styles.optionPillActive,
                                    ]}
                                    onPress={() =>
                                      setHumanReqs((prev) =>
                                        prev.map((item) =>
                                          item.id === req.id
                                            ? { ...item, roleId: r.roleId, roleName: r.roleName }
                                            : item
                                        )
                                      )
                                    }
                                  >
                                    <Text
                                      style={[
                                        styles.optionPillText,
                                        isSel && styles.optionPillTextActive,
                                      ]}
                                    >
                                      {roleLabel}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                          </View>
                        </View>

                        {/* Skills */}
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>Required Skill (Optional)</Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.optionPillRow}
                          >
                            <TouchableOpacity
                              style={[
                                styles.optionPill,
                                req.requiredSkillId === null && styles.optionPillActive,
                              ]}
                              onPress={() =>
                                setHumanReqs((prev) =>
                                  prev.map((item) =>
                                    item.id === req.id
                                      ? { ...item, requiredSkillId: null }
                                      : item
                                  )
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.optionPillText,
                                  req.requiredSkillId === null && styles.optionPillTextActive,
                                ]}
                              >
                                No specific skill
                              </Text>
                            </TouchableOpacity>

                            {skills.map((s) => {
                              const isSel = req.requiredSkillId === s.skillId;
                              return (
                                <TouchableOpacity
                                  key={s.skillId}
                                  style={[styles.optionPill, isSel && styles.optionPillActive]}
                                  onPress={() =>
                                    setHumanReqs((prev) =>
                                      prev.map((item) =>
                                        item.id === req.id
                                          ? {
                                              ...item,
                                              requiredSkillId: s.skillId,
                                              requiredSkillName: s.skillName,
                                            }
                                          : item
                                      )
                                    )
                                  }
                                >
                                  <Text
                                    style={[
                                      styles.optionPillText,
                                      isSel && styles.optionPillTextActive,
                                    ]}
                                  >
                                    {s.skillName}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>

                        {/* Quantity & Working Hours */}
                        <View style={{ flexDirection: "row", gap: 10 }}>
                          <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>Headcount</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="numeric"
                              value={String(req.quantity)}
                              onChangeText={(val) =>
                                setHumanReqs((prev) =>
                                  prev.map((item) =>
                                    item.id === req.id
                                      ? { ...item, quantity: Math.max(1, parseInt(val, 10) || 1) }
                                      : item
                                  )
                                )
                              }
                            />
                          </View>

                          <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>Hours / Day</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="numeric"
                              value={String(req.workingHoursPerDay)}
                              onChangeText={(val) =>
                                setHumanReqs((prev) =>
                                  prev.map((item) =>
                                    item.id === req.id
                                      ? {
                                          ...item,
                                          workingHoursPerDay: Math.min(
                                            24,
                                            Math.max(1, parseFloat(val) || 8)
                                          ),
                                        }
                                      : item
                                  )
                                )
                              }
                            />
                          </View>
                        </View>

                        {/* Note */}
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>Task Notes</Text>
                          <TextInput
                            style={styles.input}
                            value={req.note}
                            onChangeText={(val) =>
                              setHumanReqs((prev) =>
                                prev.map((item) => (item.id === req.id ? { ...item, note: val } : item))
                              )
                            }
                            placeholder="e.g. Experienced in forestry soil sampling..."
                          />
                        </View>
                      </View>
                    ))
                )}
              </View>
            )}

            {/* STEP 5: Land Requirements */}
            {currentStep === 5 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="leaf" size={20} color="#16a34a" />
                    <View style={styles.cardTitleContainer}>
                      <Text style={styles.cardTitle}>Step 5: Land Requirements</Text>
                      <Text style={styles.cardSubtitle}>
                        Specify plot area and soil conditions
                      </Text>
                    </View>
                  </View>

                  {landReqs.length === 0 ? (
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddLandReq} activeOpacity={0.8}>
                      <Ionicons name="add" size={16} color={Colors.primary} />
                      <Text style={styles.addBtnText}>Add Land</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {landReqs.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="map-outline" size={36} color="#94a3b8" />
                    <Text style={styles.emptyBoxText}>
                      No land plot configured (Max 1 plot per experiment)
                    </Text>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddLandReq}>
                      <Text style={styles.addBtnText}>+ Add Land Requirement</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  landReqs.map((land, idx) => (
                    <View key={land.id} style={styles.itemRowCard}>
                      <View style={styles.itemRowTop}>
                        <View style={styles.itemBadge}>
                          <Text style={styles.itemBadgeText}>Trial Land Plot</Text>
                        </View>
                        <TouchableOpacity style={styles.removeBtn} onPress={handleRemoveLandReq}>
                          <Ionicons name="trash-outline" size={15} color="#dc2626" />
                        </TouchableOpacity>
                      </View>

                      {/* Area */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>
                          Required Area (m²) <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={String(land.requiredArea)}
                          onChangeText={(val) =>
                            setLandReqs((prev) =>
                              prev.map((item) =>
                                item.id === land.id
                                  ? { ...item, requiredArea: Math.max(1, parseFloat(val) || 1) }
                                  : item
                              )
                            )
                          }
                          placeholder="e.g. 500"
                        />
                      </View>

                      {/* Soil type */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>
                          Required Soil Type <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.optionPillRow}
                        >
                          {soilTypes.map((st) => {
                            const isSel = land.requiredSoilType === st;
                            return (
                              <TouchableOpacity
                                key={st}
                                style={[styles.optionPill, isSel && styles.optionPillActive]}
                                onPress={() =>
                                  setLandReqs((prev) =>
                                    prev.map((item) =>
                                      item.id === land.id ? { ...item, requiredSoilType: st } : item
                                    )
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.optionPillText,
                                    isSel && styles.optionPillTextActive,
                                  ]}
                                >
                                  {st}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>

                      {/* Note */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Terrain & Notes</Text>
                        <TextInput
                          style={styles.input}
                          value={land.note}
                          onChangeText={(val) =>
                            setLandReqs((prev) =>
                              prev.map((item) =>
                                item.id === land.id ? { ...item, note: val } : item
                              )
                            )
                          }
                          placeholder="e.g. Sub-compartment 4B, slope < 15 degrees..."
                        />
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>

          {/* Sticky Bottom Actions Bar */}
          <View
            style={[
              styles.footerActionBar,
              { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 14 },
            ]}
          >
            {currentStep > 1 ? (
              <TouchableOpacity
                style={styles.prevBtn}
                onPress={handlePrevStep}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={16} color="#475569" />
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>
            ) : null}

            {currentStep < 5 ? (
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={handleNextStep}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.nextBtnText}>Next</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.savePlanBtn}
                onPress={handleSavePlan}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#ffffff" />
                    <Text style={styles.savePlanBtnText}>Save Experiment Draft</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* DatePicker Modal Component */}
        <DatePickerModal
          visible={datePickerVisible}
          value={datePickerCurrentVal}
          title={datePickerTitle}
          minDate={datePickerMin}
          maxDate={datePickerMax}
          onClose={() => setDatePickerVisible(false)}
          onSelect={handleDateSelected}
        />
      </SafeAreaView>
    </Modal>
  );
}
