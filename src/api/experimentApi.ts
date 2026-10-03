import client from "./client";
import {
  ExperimentItem,
  CreateExperimentRequest,
  ExperimentStatus,
} from "../types/experiment";

export function normalizeExperimentStatus(val: any): ExperimentStatus {
  if (val === null || val === undefined) return "Planning";
  if (typeof val === "number" || (!isNaN(Number(val)) && typeof val === "string" && val.trim() !== "")) {
    const num = Number(val);
    switch (num) {
      case 0: return "Draft";
      case 1: return "Submitted";
      case 2: return "Planning";
      case 3: return "Ready";
      case 4: return "Running";
      case 5: return "Completed";
      case 6: return "Cancelled";
      default: break;
    }
  }
  const s = String(val).toLowerCase().trim();
  if (s === "draft" || s === "created") return "Draft";
  if (s === "submitted" || s === "pending" || s === "waiting") return "Submitted";
  if (s === "planning" || s.includes("plan")) return "Planning";
  if (s === "ready" || s.includes("approv")) return "Ready";
  if (s === "running" || s === "inprogress" || s === "in_progress" || s === "progress") return "Running";
  if (s === "completed" || s === "done" || s === "finished") return "Completed";
  if (s === "cancelled" || s === "canceled" || s.includes("reject")) return "Cancelled";
  return "Draft";
}

export async function getExperiments(params?: {
  Keyword?: string;
  Status?: string;
  ResearcherId?: number;
  Page?: number;
  Size?: number;
}): Promise<ExperimentItem[]> {
  try {
    const res = await client.get("/Experiments", {
      params: {
        Size: 100,
        ...params,
      },
    });
    const rawList =
      res.data?.data?.items ||
      res.data?.items ||
      res.data?.data ||
      (Array.isArray(res.data) ? res.data : []);

    return rawList.map((m: any) => ({
      experimentId: Number(m.experimentId ?? m.id ?? 0),
      experimentName: m.experimentName || m.name || `Experiment #${m.experimentId || m.id}`,
      description: m.description || "",
      researcherId: m.researcherId
        ? Number(m.researcherId)
        : m.userId
        ? Number(m.userId)
        : m.createdBy
        ? Number(m.createdBy)
        : m.creatorId
        ? Number(m.creatorId)
        : m.researcher?.userId
        ? Number(m.researcher?.userId)
        : m.researcher?.id
        ? Number(m.researcher?.id)
        : undefined,
      researcherName:
        m.researcherName ||
        m.researcher?.fullName ||
        m.researcher?.username ||
        m.createdByName ||
        "",
      expectStartDate: m.expectStartDate || m.startDate || m.expectedStartDate || null,
      expectEndDate: m.expectEndDate || m.endDate || m.expectedEndDate || null,
      deadline: m.deadline || m.expectEndDate || null,
      priority: m.priority ?? m.priorityLevel ?? 1,
      status: normalizeExperimentStatus(m.status ?? m.experimentStatus),
      createdAt: m.createdAt || m.created_at || null,
      updatedAt: m.updatedAt || m.updated_at || null,
    }));
  } catch (err) {
    console.error("getExperiments error:", err);
    return [];
  }
}

export async function getExperimentById(id: number): Promise<ExperimentItem> {
  const res = await client.get(`/Experiments/${id}`);
  return res.data?.data || res.data;
}

export async function createExperiment(
  payload: CreateExperimentRequest
): Promise<ExperimentItem> {
  const res = await client.post("/Experiments", payload);
  return res.data?.data || res.data;
}

export async function updateExperiment(
  id: number,
  payload: Partial<CreateExperimentRequest>
): Promise<ExperimentItem> {
  const res = await client.put(`/Experiments/${id}`, payload);
  return res.data?.data || res.data;
}

export async function submitExperiment(id: number): Promise<void> {
  await client.post(`/Experiments/${id}/submit`);
}

export async function approveExperiment(id: number): Promise<any> {
  try {
    const res = await client.post(`/Experiments/${id}/approve`);
    return res.data;
  } catch (err) {
    const res = await client.put(`/Experiments/${id}`, { status: "Approved" });
    return res.data;
  }
}

export async function rejectExperiment(id: number, reason: string): Promise<any> {
  try {
    const res = await client.post(`/Experiments/${id}/reject`, { reason });
    return res.data;
  } catch (err) {
    const exp = await getExperimentById(id);
    const updatedDesc = exp.description
      ? `${exp.description}\n[Rejection Reason: ${reason}]`
      : `[Rejection Reason: ${reason}]`;
    const res = await client.put(`/Experiments/${id}`, {
      experimentName: exp.experimentName,
      description: updatedDesc,
      status: "Rejected",
    });
    return res.data;
  }
}
