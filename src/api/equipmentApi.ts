import client from "./client";
import { AllocationEquipmentDetail } from "../types/equipment";

export async function getMyAllocationEquipment(): Promise<AllocationEquipmentDetail[]> {
  try {
    const res = await client.get("/AllocationEquipmentDetails/mine", {
      params: { size: 200 },
    });
    return res.data?.data?.items || res.data?.items || res.data?.data || [];
  } catch (err: any) {
    if (err.response?.status === 403) {
      // Fallback for Seasonal or non-direct assigned staff
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
