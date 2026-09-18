import client from "./client";
import { AllocationEquipmentDetail, EquipmentItem, EquipmentRequest } from "../types/equipment";

export async function getEquipments(params?: {
  Size?: number;
  Page?: number;
  Status?: string;
  EquipmentTypeId?: number;
}): Promise<EquipmentItem[]> {
  try {
    const res = await client.get("/Equipments", {
      params: { Size: 100, ...params },
    });
    const rawList =
      res.data?.data?.items ||
      res.data?.items ||
      res.data?.data ||
      (Array.isArray(res.data) ? res.data : []);

    return rawList.map((m: any) => ({
      equipmentId: Number(m.equipmentId ?? m.id ?? 0),
      equipmentCode: m.equipmentCode || m.code || `EQ-${m.equipmentId || m.id}`,
      equipmentName: m.equipmentName || m.name || "Thiết bị",
      typeName: m.typeName || m.equipmentTypeName || m.equipmentType?.name || undefined,
      typeId: m.typeId || m.equipmentTypeId || m.equipmentType?.equipmentTypeId || undefined,
      status: m.status || "Available",
      efficiencyScore: m.efficiencyScore ?? m.efficiencyRate ?? undefined,
      maintenanceStatus: m.maintenanceStatus || undefined,
      serialNumber: m.serialNumber || undefined,
      createdAt: m.createdAt || m.created_at || undefined,
    }));
  } catch {
    const mine = await getMyAllocationEquipment();
    return mine.map((m) => ({
      equipmentId: m.allocationEquipmentDetailId,
      equipmentCode: m.assetCode || `EQ-${m.allocationEquipmentDetailId}`,
      equipmentName: m.allocatedEquipmentTypeName || "Thiết bị",
      typeName: m.allocatedEquipmentTypeName || undefined,
      typeId: m.allocatedEquipmentTypeId || undefined,
      status: m.status,
      efficiencyScore: m.efficiencyRate,
      serialNumber: m.serialNumber || undefined,
    }));
  }
}

export async function getEquipmentById(id: number): Promise<EquipmentItem> {
  const res = await client.get(`/Equipments/${id}`);
  const m = res.data?.data || res.data;
  return {
    equipmentId: Number(m.equipmentId ?? m.id ?? 0),
    equipmentCode: m.equipmentCode || `EQ-${m.equipmentId || m.id}`,
    equipmentName: m.equipmentName || m.name || "Thiết bị",
    typeName: m.typeName || m.equipmentTypeName || undefined,
    typeId: m.typeId || m.equipmentTypeId || undefined,
    status: m.status || "Available",
    efficiencyScore: m.efficiencyScore ?? m.efficiencyRate ?? undefined,
    maintenanceStatus: m.maintenanceStatus || undefined,
    serialNumber: m.serialNumber || undefined,
  };
}

export async function createEquipment(payload: EquipmentRequest): Promise<EquipmentItem> {
  const res = await client.post("/Equipments", payload);
  return res.data?.data || res.data;
}

export async function updateEquipment(
  id: number,
  payload: Partial<EquipmentRequest>
): Promise<EquipmentItem> {
  const res = await client.put(`/Equipments/${id}`, payload);
  return res.data?.data || res.data;
}

export async function deleteEquipment(id: number): Promise<void> {
  await client.delete(`/Equipments/${id}`);
}

export async function getMyAllocationEquipment(): Promise<AllocationEquipmentDetail[]> {
  try {
    const res = await client.get("/AllocationEquipmentDetails/mine", {
      params: { size: 200 },
    });
    return res.data?.data?.items || res.data?.items || res.data?.data || [];
  } catch (err: any) {
    if (err.response?.status === 403) {
      const allRes = await client.get("/AllocationEquipmentDetails", {
        params: { size: 200 },
      });
      return allRes.data?.data?.items || allRes.data?.items || allRes.data?.data || [];
    }
    throw err;
  }
}

export async function handoverEquipment(allocationEquipmentDetailId: number): Promise<void> {
  await client.patch(`/AllocationEquipmentDetails/mine/${allocationEquipmentDetailId}/handover`);
}

export async function returnEquipment(allocationEquipmentDetailId: number): Promise<void> {
  await client.patch(`/AllocationEquipmentDetails/mine/${allocationEquipmentDetailId}/return`);
}
