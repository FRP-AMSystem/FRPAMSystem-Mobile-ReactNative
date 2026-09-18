import client from "./client";
import {
  HumanResourceProfile,
  HumanResourceProfileRequest,
  HumanResourceStatus,
} from "../types/personnel";

function normalizeStatus(value: unknown): HumanResourceStatus {
  switch (value) {
    case "Busy":
    case "Unavailable":
    case "Inactive":
      return value;
    case "Available":
    default:
      return "Available";
  }
}

export async function getHumanResourceProfiles(): Promise<HumanResourceProfile[]> {
  try {
    const res = await client.get("/HumanResourceProfiles", {
      params: { Size: 200 },
    });
    const rawList =
      res.data?.data?.items ||
      res.data?.items ||
      res.data?.data ||
      (Array.isArray(res.data) ? res.data : []);

    const mapped: HumanResourceProfile[] = rawList.map((item: any) => ({
      humanResourceId: Number(item.humanResourceId ?? item.id ?? 0),
      userId: Number(item.userId ?? item.user?.userId ?? item.user?.id ?? 0),
      fullName:
        item.fullName ||
        item.full_name ||
        item.user?.fullName ||
        item.user?.full_name ||
        item.userName ||
        item.user?.userName ||
        null,
      username: item.username || item.user?.username || null,
      email: item.email || item.user?.email || null,
      roleId: item.roleId
        ? Number(item.roleId)
        : item.user?.roleId
        ? Number(item.user.roleId)
        : null,
      roleName:
        item.roleName ||
        item.role_name ||
        item.role?.name ||
        item.user?.roleName ||
        item.user?.role?.name ||
        null,
      maxWorkingHoursPerDay: Number(
        item.maxWorkingHoursPerDay ?? item.max_working_hours_per_day ?? 8
      ),
      currentWorkload: Number(
        item.currentWorkload ?? item.current_workload ?? 0
      ),
      status: normalizeStatus(item.status),
      createdAt: item.createdAt || item.created_at || null,
      updatedAt: item.updatedAt || item.updated_at || null,
    }));

    // Filter out Admin and Manager roles as they are NOT field human resources
    return mapped.filter((p) => {
      const r = (p.roleName || "").toLowerCase().trim();
      return (
        r !== "admin" &&
        r !== "manager" &&
        !r.includes("admin") &&
        !r.includes("manager")
      );
    });
  } catch (err) {
    console.error("getHumanResourceProfiles error:", err);
    return [];
  }
}

export async function getHumanResourceProfileById(id: number): Promise<HumanResourceProfile> {
  const res = await client.get(`/HumanResourceProfiles/${id}`);
  const item = res.data?.data || res.data;
  return {
    humanResourceId: Number(item.humanResourceId ?? item.id ?? 0),
    userId: Number(item.userId ?? 0),
    fullName: item.fullName || null,
    username: item.username || null,
    email: item.email || null,
    roleId: item.roleId ? Number(item.roleId) : null,
    roleName: item.roleName || null,
    maxWorkingHoursPerDay: Number(item.maxWorkingHoursPerDay ?? 8),
    currentWorkload: Number(item.currentWorkload ?? 0),
    status: normalizeStatus(item.status),
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
  };
}

export async function createHumanResourceProfile(
  payload: HumanResourceProfileRequest
): Promise<HumanResourceProfile> {
  const res = await client.post("/HumanResourceProfiles", payload);
  return res.data?.data || res.data;
}

export async function updateHumanResourceProfile(
  id: number,
  payload: Partial<HumanResourceProfileRequest>
): Promise<HumanResourceProfile> {
  const res = await client.put(`/HumanResourceProfiles/${id}`, payload);
  return res.data?.data || res.data;
}

export async function deleteHumanResourceProfile(id: number): Promise<void> {
  await client.delete(`/HumanResourceProfiles/${id}`);
}
