import client from "./client";

export interface AreaItem {
  areaId: number;
  areaName: string;
  description?: string;
  location?: string;
  totalArea?: number;
  soilType?: string;
  landCount?: number;
}

export async function getAreas(): Promise<AreaItem[]> {
  try {
    const res = await client.get("/Areas", {
      params: { Size: 200 },
    });
    const rawList =
      res.data?.data?.items ||
      res.data?.items ||
      res.data?.data ||
      (Array.isArray(res.data) ? res.data : []);

    return rawList.map((item: any) => ({
      areaId: Number(item.areaId ?? item.id ?? 0),
      areaName: item.areaName || item.name || `Phân khu #${item.areaId || item.id}`,
      description: item.description || item.soilType || "Khu vực khảo nghiệm thực địa",
      location: item.location || "",
      totalArea: Number(item.totalArea ?? item.areaSize ?? item.size ?? 0),
      soilType: item.soilType || "",
      landCount: Number(item.landCount ?? 0),
    }));
  } catch (err) {
    console.error("getAreas API error:", err);
    return [];
  }
}

export async function createArea(payload: {
  areaName: string;
  description?: string;
  location?: string;
  totalArea?: number;
  soilType?: string;
}): Promise<AreaItem> {
  const res = await client.post("/Areas", payload);
  return res.data?.data || res.data;
}

export async function updateArea(
  id: number,
  payload: Partial<{
    areaName: string;
    description?: string;
    location?: string;
    totalArea?: number;
    soilType?: string;
  }>
): Promise<AreaItem> {
  const res = await client.put(`/Areas/${id}`, payload);
  return res.data?.data || res.data;
}

export async function deleteArea(id: number): Promise<void> {
  await client.delete(`/Areas/${id}`);
}
