import client from "./client";
import { LandResourceItem, LandItem, LandRequest } from "../types/land";

export async function getLands(params?: {
  Size?: number;
  Page?: number;
  AreaId?: number;
  SoilType?: string;
  Status?: string;
}): Promise<LandItem[]> {
  const list = await getLandResources(params);
  return list.map((l) => ({
    landId: l.landId,
    landCode: l.landCode || `PLOT-${l.landId}`,
    landName: l.landCode || `Lô đất #${l.landId}`,
    areaId: l.areaId,
    areaName: l.areaName,
    areaSize: l.areaSize,
    area: l.areaSize,
    soilType: l.soilType || "Đất rừng",
    status: l.status || "Available",
    location: l.location,
    description: l.description,
    createdAt: l.createdAt,
  }));
}

export async function getLandResources(params?: {
  Size?: number;
  Page?: number;
  AreaId?: number;
  SoilType?: string;
  Status?: string;
}): Promise<LandResourceItem[]> {
  const res = await client.get("/LandResources", {
    params: { Size: 200, ...params },
  });
  const rawList =
    res.data?.data?.items || res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);

  return rawList.map((l: any) => ({
    landId: Number(l.landId || l.id || 0),
    landCode: l.landCode || `PLOT-${l.landId || l.id}`,
    areaId: Number(l.areaId || 0),
    areaName: l.areaName || l.area?.areaName || l.area?.name || "",
    areaSize: Number(l.areaSize ?? l.size ?? l.area ?? 0),
    soilType: l.soilType || "",
    status: l.status || "Available",
    location: l.location || "",
    description: l.description || "",
    createdAt: l.createdAt || l.created_at || null,
  }));
}

export async function getLandById(id: number): Promise<LandItem> {
  const res = await client.get(`/LandResources/${id}`);
  const l = res.data?.data || res.data;
  return {
    landId: Number(l.landId || l.id || 0),
    landCode: l.landCode || `PLOT-${l.landId || l.id}`,
    landName: l.landCode || `Lô đất #${l.landId}`,
    areaId: Number(l.areaId || 0),
    areaName: l.areaName || l.area?.areaName || "",
    areaSize: Number(l.areaSize ?? l.size ?? 0),
    area: Number(l.areaSize ?? l.size ?? 0),
    soilType: l.soilType || "",
    status: l.status || "Available",
    location: l.location || "",
    description: l.description || "",
    createdAt: l.createdAt || null,
  };
}

export async function createLand(payload: LandRequest): Promise<LandItem> {
  const res = await client.post("/LandResources", payload);
  return res.data?.data || res.data;
}

export async function updateLand(
  id: number,
  payload: Partial<LandRequest>
): Promise<LandItem> {
  const res = await client.put(`/LandResources/${id}`, payload);
  return res.data?.data || res.data;
}

export async function deleteLand(id: number): Promise<void> {
  await client.delete(`/LandResources/${id}`);
}

export async function getAllSoilTypes(): Promise<string[]> {
  try {
    const list = await getLandResources();
    const soilTypes = list
      .map((l) => l.soilType?.trim())
      .filter((st): st is string => Boolean(st));
    return Array.from(new Set(soilTypes)).sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.error("Fetch soil types error:", err);
    return [];
  }
}
