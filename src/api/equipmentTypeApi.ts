import client from "./client";

export interface EquipmentTypeItem {
  equipmentTypeId: number;
  equipmentCategoryId?: number;
  equipmentCategoryName?: string;
  name: string;
  equipmentTypeName?: string;
  totalQuantity?: number;
}

export async function getEquipmentTypes(): Promise<EquipmentTypeItem[]> {
  const res = await client.get("/EquipmentTypes", {
    params: { Size: 100 },
  });
  const rawList = res.data?.data?.items || res.data?.items || res.data?.data || [];
  return rawList.map((item: any) => ({
    equipmentTypeId: Number(item.equipmentTypeId || item.id || 0),
    equipmentCategoryId: Number(item.equipmentCategoryId || 0),
    equipmentCategoryName: item.equipmentCategoryName || "",
    name: item.name || item.equipmentTypeName || `Thiết bị #${item.equipmentTypeId}`,
    equipmentTypeName: item.name || item.equipmentTypeName || `Thiết bị #${item.equipmentTypeId}`,
    totalQuantity: Number(item.totalQuantity || 0),
  }));
}
