import client from "./client";
import {
  ExperimentItem,
  CreateExperimentRequest,
} from "../types/experiment";

export async function getExperiments(params?: {
  Keyword?: string;
  Status?: string;
  Page?: number;
  Size?: number;
}): Promise<ExperimentItem[]> {
  const res = await client.get("/Experiments", {
    params: {
      Size: 50,
      ...params,
    },
  });
  return res.data?.data?.items || res.data?.items || res.data?.data || [];
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
      ? `${exp.description}\n[Lý do từ chối: ${reason}]`
      : `[Lý do từ chối: ${reason}]`;
    const res = await client.put(`/Experiments/${id}`, {
      experimentName: exp.experimentName,
      description: updatedDesc,
      status: "Rejected",
    });
    return res.data;
  }
}
