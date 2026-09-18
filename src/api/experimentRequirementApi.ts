import client from "./client";
import {
  ExperimentEquipmentRequirementItem,
  ExperimentHumanRequirementItem,
  ExperimentLandRequirementItem,
} from "../types/experiment";

// 1. Equipment Requirements
export async function getExperimentEquipmentRequirements(
  experimentId: number
): Promise<ExperimentEquipmentRequirementItem[]> {
  const res = await client.get("/ExperimentEquipmentRequirements", {
    params: { ExperimentId: experimentId, Size: 50 },
  });
  return res.data?.data?.items || res.data?.items || res.data?.data || [];
}

export async function createExperimentEquipmentRequirement(payload: {
  experimentId: number;
  equipmentTypeId: number;
  quantity: number;
  allowSubstitute?: boolean;
  minAcceptableEfficiency?: number | null;
  note?: string | null;
}): Promise<ExperimentEquipmentRequirementItem> {
  const cleanBody: Record<string, any> = {
    experimentId: payload.experimentId,
    equipmentTypeId: payload.equipmentTypeId,
    quantity: payload.quantity,
  };
  if (typeof payload.allowSubstitute === "boolean") {
    cleanBody.allowSubstitute = payload.allowSubstitute;
  }
  if (payload.minAcceptableEfficiency != null) {
    const eff = Number(payload.minAcceptableEfficiency);
    cleanBody.minAcceptableEfficiency = !isNaN(eff) ? (eff > 1 ? Number((eff / 100).toFixed(2)) : eff) : null;
  }
  if (payload.note && payload.note.trim()) {
    cleanBody.note = payload.note.trim();
  }
  const res = await client.post("/ExperimentEquipmentRequirements", cleanBody);
  return res.data?.data || res.data;
}

// 2. Human Requirements
export async function getExperimentHumanRequirements(
  experimentId: number
): Promise<ExperimentHumanRequirementItem[]> {
  const res = await client.get("/ExperimentHumanRequirements", {
    params: { ExperimentId: experimentId, Size: 50 },
  });
  return res.data?.data?.items || res.data?.items || res.data?.data || [];
}

export async function createExperimentHumanRequirement(payload: {
  experimentId: number;
  roleId: number;
  quantity: number;
  requiredSkillId?: number | null;
  workingHoursPerDay?: number | null;
  note?: string | null;
}): Promise<ExperimentHumanRequirementItem> {
  const res = await client.post("/ExperimentHumanRequirements", payload);
  return res.data?.data || res.data;
}

// 3. Land Requirements
export async function getExperimentLandRequirements(
  experimentId: number
): Promise<ExperimentLandRequirementItem[]> {
  const res = await client.get("/ExperimentLandRequirements", {
    params: { ExperimentId: experimentId, Size: 50 },
  });
  return res.data?.data?.items || res.data?.items || res.data?.data || [];
}

export async function createExperimentLandRequirement(payload: {
  experimentId: number;
  requiredArea: number;
  requiredSoilType?: string | null;
  note?: string | null;
}): Promise<ExperimentLandRequirementItem> {
  const res = await client.post("/ExperimentLandRequirements", payload);
  return res.data?.data || res.data;
}
