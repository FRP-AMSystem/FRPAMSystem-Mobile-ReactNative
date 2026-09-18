import client from "./client";
import { AIOptimizationCandidate } from "../types/aiOptimization";
import {
  getAllocationPlans,
  createAllocationPlan,
  updateAllocationPlan,
} from "./allocationPlanApi";
import {
  getExperimentEquipmentRequirements,
  getExperimentHumanRequirements,
  getExperimentLandRequirements,
} from "./experimentRequirementApi";
import { getExperimentPhases } from "./experimentPhaseApi";
import { createSchedule, deleteSchedule } from "./scheduleApi";
import { getExperimentById } from "./experimentApi";

export interface OptimizationSettings {
  populationSize?: number;
  generationCount?: number;
  mutationRate?: number;
  initialMutationRate?: number;
  finalMutationRate?: number;
  crossoverRate?: number;
  eliteCount?: number;
  tournamentSize?: number;
  topSuggestionCount?: number;
  maxScheduleShiftDays?: number;
  landWeight?: number;
  humanWeight?: number;
  equipmentWeight?: number;
  scheduleWeight?: number;
  penaltyWeight?: number;
  bonusWeight?: number;
  hardConstraintPenalty?: number;
  softConstraintPenalty?: number;
}

export const DEFAULT_OPTIMIZATION_SETTINGS: OptimizationSettings = {
  populationSize: 100,
  generationCount: 80,
  mutationRate: 0.15,
  initialMutationRate: 0.3,
  finalMutationRate: 0.05,
  crossoverRate: 0.8,
  eliteCount: 10,
  tournamentSize: 5,
  topSuggestionCount: 5,
  maxScheduleShiftDays: 7,
  landWeight: 25,
  humanWeight: 25,
  equipmentWeight: 25,
  scheduleWeight: 25,
  penaltyWeight: 1.0,
  bonusWeight: 1.0,
  hardConstraintPenalty: 40,
  softConstraintPenalty: 8,
};

export async function generateAISuggestions(
  experimentId: number,
  settings: OptimizationSettings = {}
): Promise<AIOptimizationCandidate[]> {
  const mergedSettings = {
    ...DEFAULT_OPTIMIZATION_SETTINGS,
    ...settings,
  };

  const res = await client.post(
    `/AllocationOptimizations/experiments/${experimentId}/suggestions`,
    mergedSettings
  );

  const rawData = res.data?.data ?? res.data;
  const rawList: any[] = Array.isArray(rawData) ? rawData : [];

  if (rawList.length === 0) {
    throw new Error("Không có gợi ý phân bổ nào từ thuật toán giải tối ưu.");
  }

  return rawList.map((item: any, idx: number) => {
    const rank = Number(item.rank ?? idx + 1);
    const fitness = Number(item.fitnessScore ?? 0);
    const timeline = Array.isArray(item.timeline) ? item.timeline : [];

    const durationDays = timeline.reduce(
      (max: number, t: any) => Math.max(max, Number(t.durationDays ?? 0)),
      0
    );

    return {
      rank,
      fitnessScore: fitness,
      penaltyScore: Number(item.penaltyScore ?? 0),
      bonusScore: Number(item.bonusScore ?? 0),
      fitnessBreakdown: item.fitnessBreakdown,
      constraintReport: item.constraintReport,
      conflictCount: Number(item.conflictCount ?? 0),
      estimatedCompletionTime: item.estimatedCompletionTime,
      estimatedDurationDays: durationDays,
      advantages: Array.isArray(item.advantages) ? item.advantages : [],
      disadvantages: Array.isArray(item.disadvantages) ? item.disadvantages : [],
      timeline,
      allocatedLands: Array.isArray(item.allocatedLands) ? item.allocatedLands : [],
      allocatedHumans: Array.isArray(item.allocatedHumans) ? item.allocatedHumans : [],
      allocatedEquipment: Array.isArray(item.allocatedEquipment) ? item.allocatedEquipment : [],
    };
  });
}

function normalizeEfficiency(eff: any): number {
  if (eff == null) return 1;
  const n = Number(eff);
  if (isNaN(n)) return 1;
  return n > 1 ? Number((n / 100).toFixed(2)) : n;
}

function normalizeDate(d?: string | null): string {
  if (!d) return new Date().toISOString();
  if (d.includes("T")) return d;
  return `${d}T00:00:00`;
}

/**
 * Apply selected AI Candidate:
 * 1. Find or create a Draft Allocation Plan for the experiment
 * 2. Clean previous draft allocation details
 * 3. Persist equipment, human, land allocation details matching requirement specs
 * 4. Create schedule records for assigned personnel
 * 5. Update plan fitness score
 */
export async function applyAISuggestion(
  experimentId: number,
  candidate: AIOptimizationCandidate
): Promise<{ planId: number }> {
  // 1. Load experiment and existing requirement specs
  const [exp, equipReqs, humanReqs, landReqs, phases] = await Promise.all([
    getExperimentById(experimentId).catch(() => null),
    getExperimentEquipmentRequirements(experimentId).catch(() => []),
    getExperimentHumanRequirements(experimentId).catch(() => []),
    getExperimentLandRequirements(experimentId).catch(() => []),
    getExperimentPhases(experimentId).catch(() => []),
  ]);

  // 2. Find or create Draft Allocation Plan
  const plans = await getAllocationPlans({ ExperimentId: experimentId, Size: 100 });
  let draftPlan = plans.find(
    (p) =>
      Number(p.experimentId) === Number(experimentId) &&
      (p.approveStatus || "").toLowerCase() === "draft"
  );

  let planId: number;
  if (draftPlan) {
    planId = draftPlan.allocationPlanId;
  } else {
    const created = await createAllocationPlan({
      experimentId,
      fitnessScore: candidate.fitnessScore,
      approveStatus: "Draft",
    });
    planId = Number(created?.allocationPlanId || (created as any)?.id || 0);
  }

  if (!planId || planId <= 0) {
    throw new Error("Không thể khởi tạo Kế hoạch phân bổ (Draft Allocation Plan).");
  }

  // 3. Clear previous allocation details for this draft plan
  try {
    const [eqRes, huRes, landRes, schedRes] = await Promise.all([
      client.get("/AllocationEquipmentDetails", { params: { allocationPlanId: planId, Size: 500 } }).catch(() => ({ data: [] })),
      client.get("/AllocationHumanDetails", { params: { allocationPlanId: planId, Size: 500 } }).catch(() => ({ data: [] })),
      client.get("/AllocationLandDetails", { params: { allocationPlanId: planId, Size: 500 } }).catch(() => ({ data: [] })),
      client.get("/Schedules", { params: { allocationPlanId: planId, Size: 500 } }).catch(() => ({ data: [] })),
    ]);

    const oldEq = eqRes.data?.data?.items || eqRes.data?.items || (Array.isArray(eqRes.data) ? eqRes.data : []);
    const oldHu = huRes.data?.data?.items || huRes.data?.items || (Array.isArray(huRes.data) ? huRes.data : []);
    const oldLand = landRes.data?.data?.items || landRes.data?.items || (Array.isArray(landRes.data) ? landRes.data : []);
    const oldSched = schedRes.data?.data?.items || schedRes.data?.items || (Array.isArray(schedRes.data) ? schedRes.data : []);

    for (const item of oldSched) {
      if (item.scheduleId) {
        await deleteSchedule(item.scheduleId).catch(() => {});
      }
    }
    for (const item of oldEq) {
      if (item.allocationEquipmentDetailId) {
        await client.delete(`/AllocationEquipmentDetails/${item.allocationEquipmentDetailId}`).catch(() => {});
      }
    }
    for (const item of oldHu) {
      if (item.allocationHumanDetailId) {
        await client.delete(`/AllocationHumanDetails/${item.allocationHumanDetailId}`).catch(() => {});
      }
    }
    for (const item of oldLand) {
      if (item.allocationLandDetailId) {
        await client.delete(`/AllocationLandDetails/${item.allocationLandDetailId}`).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Clean draft allocation details warning:", err);
  }

  // 4. Persist Candidate Equipment Details
  if (Array.isArray(candidate.allocatedEquipment)) {
    for (const eq of candidate.allocatedEquipment) {
      const equipmentInstanceId = Number(eq.equipmentInstanceId || 0);
      const allocatedEquipmentTypeId = Number(
        eq.allocatedEquipmentTypeId || eq.requiredEquipmentTypeId || 0
      );

      if (equipmentInstanceId > 0 && allocatedEquipmentTypeId > 0) {
        const req =
          equipReqs.find(
            (r) =>
              Number(r.equipmentTypeId) === Number(eq.requiredEquipmentTypeId) ||
              Number(r.equipmentTypeId) === allocatedEquipmentTypeId
          ) || equipReqs[0];

        const phase = phases.find(
          (p) =>
            Number(p.experimentPhaseId) === Number(eq.phaseId) ||
            p.phaseName?.toLowerCase() === eq.phaseName?.toLowerCase()
        ) || phases[0];

        const startDate = normalizeDate(
          eq.startDate || phase?.expectedStartDate || exp?.expectStartDate
        );
        const endDate = normalizeDate(
          eq.endDate || phase?.expectedEndDate || exp?.expectEndDate
        );

        await client.post("/AllocationEquipmentDetails", {
          allocationPlanId: planId,
          expEquipmentReqId: req?.expEquipmentReqId || null,
          phaseEquipmentReqId: null,
          allocatedEquipmentTypeId,
          equipmentInstanceId,
          quantity: 1,
          efficiencyRate: normalizeEfficiency(eq.efficiencyRate),
          isSubstitute: Boolean(eq.isSubstitute),
          startDate,
          endDate,
          status: "Allocated",
        }).catch((e) => console.warn("Save equipment detail error:", e));
      }
    }
  }

  // 5. Persist Candidate Human Details & Schedules
  if (Array.isArray(candidate.allocatedHumans)) {
    for (const hu of candidate.allocatedHumans) {
      const humanResourceId = Number(hu.humanResourceId || 0);
      const roleId = Number(hu.roleId || 0);

      if (humanResourceId > 0 && roleId > 0) {
        const req =
          humanReqs.find((r) => Number(r.roleId) === roleId) || humanReqs[0];

        const phase = phases.find(
          (p) =>
            Number(p.experimentPhaseId) === Number(hu.phaseId) ||
            p.phaseName?.toLowerCase() === hu.phaseName?.toLowerCase()
        ) || phases[0];

        const startDate = normalizeDate(
          hu.startDate || phase?.expectedStartDate || exp?.expectStartDate
        );
        const endDate = normalizeDate(
          hu.endDate || phase?.expectedEndDate || exp?.expectEndDate
        );

        await client.post("/AllocationHumanDetails", {
          allocationPlanId: planId,
          expHumanReqId: req?.expHumanReqId || null,
          phaseHumanReqId: null,
          humanResourceId,
          roleId,
          workingHours: Math.min(9, Math.max(1, Number(req?.workingHoursPerDay || 8))),
          startDate,
          endDate,
          status: "Allocated",
        }).catch((e) => console.warn("Save human detail error:", e));

        // Create schedule record
        await createSchedule({
          allocationPlanId: planId,
          phaseId: phase?.experimentPhaseId || null,
          title: `Khảo nghiệm: ${exp?.experimentName || "Đề tài"} - ${phase?.phaseName || "Giai đoạn"}`,
          description: `Phân công nhân sự: ${hu.fullName || "Kỹ thuật viên"}`,
          assignedHumanResourceId: humanResourceId,
          startDate,
          endDate,
          status: "Planned" as any,
          priority: Number(exp?.priority ?? 1),
        }).catch((e) => console.warn("Save schedule error:", e));
      }
    }
  }

  // 6. Persist Candidate Land Details
  if (Array.isArray(candidate.allocatedLands)) {
    for (const land of candidate.allocatedLands) {
      const landId = Number(land.landId || 0);
      if (landId > 0) {
        const req =
          landReqs.find(
            (r) =>
              r.requiredSoilType?.toLowerCase() === land.soilType?.toLowerCase()
          ) || landReqs[0];

        const phase = phases.find(
          (p) =>
            Number(p.experimentPhaseId) === Number(land.phaseId) ||
            p.phaseName?.toLowerCase() === land.phaseName?.toLowerCase()
        ) || phases[0];

        const startDate = normalizeDate(
          land.startDate || phase?.expectedStartDate || exp?.expectStartDate
        );
        const endDate = normalizeDate(
          land.endDate || phase?.expectedEndDate || exp?.expectEndDate
        );

        await client.post("/AllocationLandDetails", {
          allocationPlanId: planId,
          expLandReqId: req?.expLandReqId || null,
          phaseLandReqId: null,
          landId,
          status: "Allocated",
          allocatedArea: Number(land.areaSize || req?.requiredArea || 0),
          startDate,
          endDate,
        }).catch((e) => console.warn("Save land detail error:", e));
      }
    }
  }

  // 7. Update Allocation Plan Fitness Score & Rationale
  await updateAllocationPlan(planId, {
    fitnessScore: candidate.fitnessScore,
    approveStatus: "Draft",
    advantages: candidate.advantages,
    disadvantages: candidate.disadvantages,
  }).catch(() => {});

  return { planId };
}
