import client from "./client";
import { ScheduleItem } from "../types/schedule";

export async function getMySchedules(): Promise<ScheduleItem[]> {
  try {
    const res = await client.get("/Schedules/mine", {
      params: { size: 100 },
    });
    return res.data?.data?.items || res.data?.items || res.data?.data || [];
  } catch (err: any) {
    if (err.response?.status === 403) {
      return getAllSchedules();
    }
    throw err;
  }
}

export async function getAllSchedules(): Promise<ScheduleItem[]> {
  const res = await client.get("/Schedules", {
    params: { size: 100 },
  });
  return res.data?.data?.items || res.data?.items || res.data?.data || [];
}

export async function getScheduleById(id: number): Promise<ScheduleItem> {
  try {
    const res = await client.get(`/Schedules/mine/${id}`);
    return res.data?.data || res.data;
  } catch (err: any) {
    const res = await client.get(`/Schedules/${id}`);
    return res.data?.data || res.data;
  }
}

export async function createSchedule(payload: Partial<ScheduleItem>): Promise<ScheduleItem> {
  const res = await client.post("/Schedules", payload);
  return res.data?.data || res.data;
}

export async function deleteSchedule(id: number): Promise<void> {
  await client.delete(`/Schedules/${id}`);
}


