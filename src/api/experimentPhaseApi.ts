import client from "./client";
import { ExperimentPhaseItem } from "../types/experiment";

function sanitizeDate(d?: string | null): string {
  if (!d) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}T00:00:00`;
  }
  const clean = d.slice(0, 10);
  return `${clean}T00:00:00`;
}

export async function getExperimentPhases(
  experimentId: number
): Promise<ExperimentPhaseItem[]> {
  const res = await client.get("/ExperimentPhases", {
    params: { ExperimentId: experimentId, Size: 50 },
  });
  return res.data?.data?.items || res.data?.items || res.data?.data || [];
}

export async function createExperimentPhase(
  payload: Omit<ExperimentPhaseItem, "experimentPhaseId">
): Promise<ExperimentPhaseItem> {
  const sanitized = {
    experimentId: Number(payload.experimentId),
    phaseName: String(payload.phaseName || "").trim(),
    phaseDescription: payload.phaseDescription ? String(payload.phaseDescription).trim() : "",
    phaseOrder: Number(payload.phaseOrder) || 1,
    expectedStartDate: sanitizeDate(payload.expectedStartDate),
    expectedEndDate: sanitizeDate(payload.expectedEndDate),
    status: payload.status || "Planned",
  };
  const res = await client.post("/ExperimentPhases", sanitized);
  return res.data?.data || res.data;
}

export async function updateExperimentPhase(
  id: number,
  payload: Partial<ExperimentPhaseItem>
): Promise<ExperimentPhaseItem> {
  const sanitized = {
    ...payload,
    expectedStartDate: sanitizeDate(payload.expectedStartDate),
    expectedEndDate: sanitizeDate(payload.expectedEndDate),
  };
  const res = await client.put(`/ExperimentPhases/${id}`, sanitized);
  return res.data?.data || res.data;
}

export async function deleteExperimentPhase(id: number): Promise<void> {
  await client.delete(`/ExperimentPhases/${id}`);
}
