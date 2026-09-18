import React, { useState, useEffect } from "react";
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
  { value: "0", label: "Thấp (Low)" },
  { value: "1", label: "Trung bình (Med)" },
  { value: "2", label: "Cao (High)" },
  { value: "3", label: "Khẩn cấp (Urgent)" },
];

export function CreateExperimentModal({
  visible,
  onClose,
  onSuccess,
}: CreateExperimentModalProps) {
  const insets = useSafeAreaInsets();
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
      const fieldRoles = rls.filter(
        (r) => !["admin", "manager"].includes((r.roleName || "").toLowerCase())
      );
      setRoles(fieldRoles.length > 0 ? fieldRoles : rls);
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
      phaseName: `Giai đoạn ${nextOrder}`,
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
      phaseName: curPhase?.phaseName || "Giai đoạn 1",
      equipmentTypeId: firstType ? firstType.equipmentTypeId : 1,
      equipmentTypeName: firstType ? firstType.name : "Thiết bị",
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
    const firstRole = roles[0] || { roleId: 3, roleName: "Technician" };
    const newReq: HumanReqFormItem = {
      id: `hu-req-${Date.now()}-${Math.random()}`,
      phaseId: curPhase?.id || "",
      phaseName: curPhase?.phaseName || "Giai đoạn 1",
      roleId: firstRole.roleId,
      roleName: firstRole.roleName,
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
      Alert.alert("Thông báo", "Mỗi đề tài thử nghiệm chỉ yêu cầu tối đa 1 khu đất khảo nghiệm.");
      return;
    }
    const newReq: LandReqFormItem = {
      id: `land-req-${Date.now()}`,
      requiredArea: 500,
      requiredSoilType: soilTypes[0] || "Đất đỏ Bazan",
      note: "",
    };
    setLandReqs([newReq]);
  };

  const handleRemoveLandReq = () => {
    setLandReqs([]);
  };

  // Stepper logic
  const handleNextStep = () => {
    setError("");

    if (currentStep === 1) {
      if (!experimentName.trim()) {
        setError("Vui lòng nhập tên đề tài thử nghiệm.");
        return;
      }
      if (expectStartDate && expectEndDate && expectStartDate > expectEndDate) {
        setError("Ngày kết thúc dự kiến phải sau ngày bắt đầu.");
        return;
      }
      if (deadline && expectEndDate && deadline < expectEndDate) {
        setError("Hạn nộp báo cáo phải sau hoặc bằng ngày kết thúc.");
        return;
      }
      if (phases.length === 0) {
        // Auto create 1 default phase if none exists
        const defaultPhase: PhaseFormItem = {
          id: `phase-${Date.now()}`,
          phaseName: "Giai đoạn 1: Chuẩn bị & Triển khai",
          phaseDescription: "Công tác chuẩn bị hiện trường và bố trí thí nghiệm",
          phaseOrder: 1,
          expectedStartDate: expectStartDate || new Date().toISOString().slice(0, 10),
          expectedEndDate: expectEndDate || new Date().toISOString().slice(0, 10),
        };
        setPhases([defaultPhase]);
        setActivePhaseId(defaultPhase.id);
      }
    }

    if (currentStep === 2) {
      if (phases.length === 0) {
        setError("Vui lòng thêm ít nhất 1 giai đoạn khảo nghiệm.");
        return;
      }
      if (!activePhaseId) {
        setActivePhaseId(phases[0].id);
      }
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
    const trimmedName = experimentName.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập tên đề tài.");
      setCurrentStep(1);
      return;
    }

    setSaving(true);
    try {
      // 1. Check duplicate name
      try {
        const existingList = await getExperiments({ Keyword: trimmedName, Size: 20 });
        const isDuplicate = existingList.some(
          (item) => item.experimentName?.toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
          setError(`Tên đề tài "${trimmedName}" đã tồn tại. Vui lòng đặt tên khác.`);
          setSaving(false);
          setCurrentStep(1);
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

      const expPayload = {
        experimentName: trimmedName,
        description: description.trim() || null,
        expectStartDate: sanitizeIsoDate(expectStartDate),
        expectEndDate: sanitizeIsoDate(expectEndDate),
        deadline: sanitizeIsoDate(deadline || expectEndDate),
        priority: Number(priority) || 1,
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
        "Tạo đề tài thành công",
        `Đề tài "${trimmedName}" đã được lưu dưới dạng Bản nháp (Draft) kèm đầy đủ các giai đoạn và yêu cầu tài nguyên.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Create experiment wizard failed:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "Không thể lưu đề tài thử nghiệm. Vui lòng kiểm tra lại thông tin.";
      setError(msg);
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
                <Text style={styles.headerTag}>LẬP KẾ HOẠCH KHẢO NGHIỆM</Text>
                <Text style={styles.headerTitle}>Tạo Đề tài Mới</Text>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Stepper Indicator */}
            <View style={styles.stepperContainer}>
              {[
                { step: 1, label: "Thông tin" },
                { step: 2, label: "Giai đoạn" },
                { step: 3, label: "Thiết bị" },
                { step: 4, label: "Nhân sự" },
                { step: 5, label: "Khu đất" },
              ].map((s, idx) => {
                const isActive = currentStep === s.step;
                const isCompleted = currentStep > s.step;

                return (
                  <React.Fragment key={s.step}>
                    <TouchableOpacity
                      style={styles.stepItem}
                      onPress={() => setCurrentStep(s.step)}
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
                    <View>
                      <Text style={styles.cardTitle}>Bước 1: Thông tin Đề tài</Text>
                      <Text style={styles.cardSubtitle}>
                        Mục tiêu nghiên cứu và giới hạn thời gian thực hiện
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Tên đề tài */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Tên đề tài nghiên cứu <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: Đánh giá chất lượng đất rừng thông trồng năm 2026..."
                    placeholderTextColor="#94a3b8"
                    value={experimentName}
                    onChangeText={setExperimentName}
                  />
                </View>

                {/* Mức ưu tiên */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Mức độ ưu tiên</Text>
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

                {/* Ngày bắt đầu */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Ngày bắt đầu dự kiến</Text>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() =>
                      openDatePicker(
                        "expectStartDate",
                        "Chọn ngày bắt đầu",
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
                      {expectStartDate || "Chọn ngày bắt đầu"}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Ngày kết thúc */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Ngày kết thúc dự kiến</Text>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() =>
                      openDatePicker(
                        "expectEndDate",
                        "Chọn ngày kết thúc",
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
                      {expectEndDate || "Chọn ngày kết thúc"}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Hạn nộp */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Hạn chót nộp báo cáo (Deadline)</Text>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() =>
                      openDatePicker(
                        "deadline",
                        "Chọn hạn chót nộp báo cáo",
                        deadline,
                        expectEndDate || expectStartDate || new Date().toISOString().slice(0, 10)
                      )
                    }
                  >
                    <Text
                      style={deadline ? styles.datePickerValue : styles.datePickerPlaceholder}
                    >
                      {deadline || "Chọn hạn nộp"}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Mô tả */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Mô tả & Mục tiêu nghiên cứu</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Mô tả phương pháp khảo nghiệm, mục tiêu dự kiến đạt được..."
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
                    <View>
                      <Text style={styles.cardTitle}>Bước 2: Giai đoạn Khảo nghiệm</Text>
                      <Text style={styles.cardSubtitle}>
                        Phân chia tiến trình thành các giai đoạn tuần tự
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.addBtn} onPress={handleAddPhase} activeOpacity={0.8}>
                    <Ionicons name="add" size={16} color={Colors.primary} />
                    <Text style={styles.addBtnText}>Thêm Phase</Text>
                  </TouchableOpacity>
                </View>

                {phases.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="layers-outline" size={36} color="#94a3b8" />
                    <Text style={styles.emptyBoxText}>Chưa có giai đoạn nào</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddPhase}>
                      <Text style={styles.addBtnText}>+ Thêm giai đoạn đầu tiên</Text>
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
                        <Text style={styles.fieldLabel}>Tên giai đoạn</Text>
                        <TextInput
                          style={styles.input}
                          value={phase.phaseName}
                          onChangeText={(val) =>
                            setPhases((prev) =>
                              prev.map((p) => (p.id === phase.id ? { ...p, phaseName: val } : p))
                            )
                          }
                          placeholder="VD: Chuẩn bị hiện trường & Lấy mẫu đất"
                        />
                      </View>

                      {/* Dates */}
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                          <Text style={styles.fieldLabel}>Bắt đầu</Text>
                          <TouchableOpacity
                            style={styles.datePickerBtn}
                            onPress={() =>
                              openDatePicker(
                                `phase-start-${phase.id}`,
                                "Ngày bắt đầu giai đoạn",
                                phase.expectedStartDate,
                                expectStartDate || undefined,
                                phase.expectedEndDate || expectEndDate || undefined
                              )
                            }
                          >
                            <Text style={styles.datePickerValue}>
                              {phase.expectedStartDate || "Chọn ngày"}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                          <Text style={styles.fieldLabel}>Kết thúc</Text>
                          <TouchableOpacity
                            style={styles.datePickerBtn}
                            onPress={() =>
                              openDatePicker(
                                `phase-end-${phase.id}`,
                                "Ngày kết thúc giai đoạn",
                                phase.expectedEndDate,
                                phase.expectedStartDate || expectStartDate || undefined,
                                expectEndDate || undefined
                              )
                            }
                          >
                            <Text style={styles.datePickerValue}>
                              {phase.expectedEndDate || "Chọn ngày"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Description */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Nội dung công việc</Text>
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
                          placeholder="Công việc trọng tâm trong giai đoạn này..."
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
                    <View>
                      <Text style={styles.cardTitle}>Bước 3: Yêu cầu Thiết bị</Text>
                      <Text style={styles.cardSubtitle}>
                        Khai báo máy móc, phương tiện cần dùng cho từng giai đoạn
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={handleAddEquipmentReq}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary} />
                    <Text style={styles.addBtnText}>Thêm Thiết bị</Text>
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
                      Chưa có yêu cầu thiết bị nào cho {curActivePhase?.phaseName || "giai đoạn này"}
                    </Text>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddEquipmentReq}>
                      <Text style={styles.addBtnText}>+ Thêm thiết bị cần dùng</Text>
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
                              [{curActivePhase?.phaseName || "Phase"}] Thiết bị #{idx + 1}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.removeBtn}
                            onPress={() => handleRemoveEquipmentReq(req.id)}
                          >
                            <Ionicons name="trash-outline" size={15} color="#dc2626" />
                          </TouchableOpacity>
                        </View>

                        {/* Loại thiết bị Selector */}
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>
                            Loại máy móc / Thiết bị <Text style={styles.requiredStar}>*</Text>
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

                        {/* Số lượng & Hiệu suất */}
                        <View style={{ flexDirection: "row", gap: 10 }}>
                          <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>Số lượng (chiếc)</Text>
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
                            <Text style={styles.fieldLabel}>Hiệu suất tối thiểu (%)</Text>
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
                            Cho phép dùng thiết bị thay thế nếu hết máy
                          </Text>
                        </TouchableOpacity>

                        {/* Note */}
                        <View style={[styles.fieldGroup, { marginTop: 8 }]}>
                          <Text style={styles.fieldLabel}>Ghi chú kỹ thuật</Text>
                          <TextInput
                            style={styles.input}
                            value={req.note}
                            onChangeText={(val) =>
                              setEquipmentReqs((prev) =>
                                prev.map((r) => (r.id === req.id ? { ...r, note: val } : r))
                              )
                            }
                            placeholder="VD: Cần kèm theo bộ cảm biến GPS..."
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
                    <View>
                      <Text style={styles.cardTitle}>Bước 4: Yêu cầu Nhân sự</Text>
                      <Text style={styles.cardSubtitle}>
                        Bố trí vai trò (Kỹ thuật viên / Thời vụ) và kỹ năng yêu cầu
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={handleAddHumanReq}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary} />
                    <Text style={styles.addBtnText}>Thêm Nhân sự</Text>
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
                      Chưa có yêu cầu nhân sự nào cho {curActivePhase?.phaseName || "giai đoạn này"}
                    </Text>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddHumanReq}>
                      <Text style={styles.addBtnText}>+ Thêm nhân sự cần bố trí</Text>
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
                              [{curActivePhase?.phaseName || "Phase"}] Nhân sự #{idx + 1}
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
                          <Text style={styles.fieldLabel}>Vai trò (Role)</Text>
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                            {roles.map((r) => {
                              const isSel = req.roleId === r.roleId;
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
                                    {r.roleName === "Technician"
                                      ? "Kỹ thuật viên"
                                      : r.roleName === "Seasonal"
                                      ? "Nhân sự Thời vụ"
                                      : r.roleName}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        {/* Kỹ năng chuyên môn */}
                        <View style={styles.fieldGroup}>
                          <Text style={styles.fieldLabel}>Kỹ năng chuyên môn (Tùy chọn)</Text>
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
                                Không yêu cầu
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

                        {/* Số lượng & Giờ công */}
                        <View style={{ flexDirection: "row", gap: 10 }}>
                          <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.fieldLabel}>Số người</Text>
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
                            <Text style={styles.fieldLabel}>Giờ công / ngày</Text>
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
                          <Text style={styles.fieldLabel}>Ghi chú nhiệm vụ</Text>
                          <TextInput
                            style={styles.input}
                            value={req.note}
                            onChangeText={(val) =>
                              setHumanReqs((prev) =>
                                prev.map((item) => (item.id === req.id ? { ...item, note: val } : item))
                              )
                            }
                            placeholder="VD: Cần kinh nghiệm lấy mẫu đất rừng thực địa..."
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
                    <View>
                      <Text style={styles.cardTitle}>Bước 5: Yêu cầu Đất Khảo nghiệm</Text>
                      <Text style={styles.cardSubtitle}>
                        Khai báo diện tích và điều kiện thổ nhưỡng
                      </Text>
                    </View>
                  </View>

                  {landReqs.length === 0 ? (
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddLandReq} activeOpacity={0.8}>
                      <Ionicons name="add" size={16} color={Colors.primary} />
                      <Text style={styles.addBtnText}>Cấu hình Đất</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {landReqs.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="map-outline" size={36} color="#94a3b8" />
                    <Text style={styles.emptyBoxText}>
                      Chưa cấu hình yêu cầu đất (Tối đa 1 khu đất / đề tài)
                    </Text>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddLandReq}>
                      <Text style={styles.addBtnText}>+ Thêm yêu cầu đất khảo nghiệm</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  landReqs.map((land, idx) => (
                    <View key={land.id} style={styles.itemRowCard}>
                      <View style={styles.itemRowTop}>
                        <View style={styles.itemBadge}>
                          <Text style={styles.itemBadgeText}>Lô đất Khảo nghiệm</Text>
                        </View>
                        <TouchableOpacity style={styles.removeBtn} onPress={handleRemoveLandReq}>
                          <Ionicons name="trash-outline" size={15} color="#dc2626" />
                        </TouchableOpacity>
                      </View>

                      {/* Diện tích */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>
                          Diện tích yêu cầu (m²) <Text style={styles.requiredStar}>*</Text>
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
                          placeholder="VD: 500"
                        />
                      </View>

                      {/* Loại thổ nhưỡng */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>
                          Loại thổ nhưỡng yêu cầu <Text style={styles.requiredStar}>*</Text>
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
                        <Text style={styles.fieldLabel}>Yêu cầu địa hình & Ghi chú</Text>
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
                          placeholder="VD: Thuộc tiểu khu 4B, độ dốc < 15 độ..."
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
                <Text style={styles.prevBtnText}>Quay lại</Text>
              </TouchableOpacity>
            ) : null}

            {currentStep < 5 ? (
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={handleNextStep}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.nextBtnText}>Tiếp tục</Text>
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
                    <Text style={styles.savePlanBtnText}>Lưu Bản nháp Đề tài</Text>
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
