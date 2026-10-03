import client from "./client";

export interface EquipmentTypeItem {
  equipmentTypeId: number;
  equipmentCategoryId?: number;
  equipmentCategoryName?: string;
  name: string;
  equipmentTypeName?: string;
  trackingType?: "QuantityBased" | "Individual" | string;
  totalQuantity?: number;
  description?: string;
}

export async function getEquipmentTypes(): Promise<EquipmentTypeItem[]> {
  const res = await client.get("/EquipmentTypes", {
    params: { Size: 100 },
  });
  const rawList = res.data?.data?.items || res.data?.items || res.data?.data || [];
  return rawList.map((item: any) => {
    let trackingType = item.trackingType || item.tracking_type || "QuantityBased";
    if (typeof trackingType === "number") {
      trackingType = trackingType === 1 ? "Individual" : "QuantityBased";
    }
    return {
      equipmentTypeId: Number(item.equipmentTypeId || item.id || 0),
      equipmentCategoryId: Number(item.equipmentCategoryId || 0),
      equipmentCategoryName: item.equipmentCategoryName || item.category || "",
      name: item.name || item.equipmentTypeName || item.typeName || `Equipment #${item.equipmentTypeId}`,
      equipmentTypeName: item.name || item.equipmentTypeName || item.typeName || `Equipment #${item.equipmentTypeId}`,
      trackingType,
      totalQuantity: Number(item.totalQuantity ?? item.quantity ?? 0),
      description: item.description || "",
    };
  });
}
