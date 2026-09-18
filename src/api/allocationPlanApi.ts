import client from "./client";
import {
  AllocationPlanItem,
  AllocatedEquipmentItem,
  AllocatedHumanItem,
  AllocatedLandItem,
} from "../types/allocationPlan";

async function enrichAllocationPlans(plans: AllocationPlanItem[]): Promise<AllocationPlanItem[]> {
  if (!plans || plans.length === 0) return plans;
  try {
    const [equipRes, humanRes, landRes, schedRes, expEquipRes, expHumanRes, expLandRes] =
      await Promise.allSettled([
        client.get("/AllocationEquipmentDetails", { params: { Size: 500 } }),
        client.get("/AllocationHumanDetails", { params: { Size: 500 } }),
        client.get("/AllocationLandDetails", { params: { Size: 500 } }),
        client.get("/Schedules", { params: { Size: 500 } }),
        client.get("/ExperimentEquipmentRequirements", { params: { Size: 500 } }),
        client.get("/ExperimentHumanRequirements", { params: { Size: 500 } }),
        client.get("/ExperimentLandRequirements", { params: { Size: 500 } }),
      ]);

    const getItems = (res: PromiseSettledResult<any>): any[] => {
      if (res.status !== "fulfilled") return [];
      const d = res.value.data;
      return d?.data?.items || d?.items || d?.data || (Array.isArray(d) ? d : []);
    };

    const equips = getItems(equipRes);
    const humans = getItems(humanRes);
    const lands = getItems(landRes);
    const scheds = getItems(schedRes);
    const expEquips = getItems(expEquipRes);
    const expHumans = getItems(expHumanRes);
    const expLands = getItems(expLandRes);

    return plans.map((p) => {
      const eDirect = equips.filter(
        (x) =>
          x.allocationPlanId === p.allocationPlanId ||
          (x.experimentId === p.experimentId && p.experimentId)
      ).length;
      const eExp = expEquips.filter((x) => x.experimentId === p.experimentId).length;
      const equipmentDetailCount =
        p.equipmentDetailCount && p.equipmentDetailCount > 0
          ? p.equipmentDetailCount
          : eDirect || eExp || 0;

      const hDirect = humans.filter(
        (x) =>
          x.allocationPlanId === p.allocationPlanId ||
          (x.experimentId === p.experimentId && p.experimentId)
      ).length;
      const hExp = expHumans.filter((x) => x.experimentId === p.experimentId).length;
      const humanDetailCount =
        p.humanDetailCount && p.humanDetailCount > 0
          ? p.humanDetailCount
          : hDirect || hExp || 0;

      const lDirect = lands.filter(
        (x) =>
          x.allocationPlanId === p.allocationPlanId ||
          (x.experimentId === p.experimentId && p.experimentId)
      ).length;
      const lExp = expLands.filter((x) => x.experimentId === p.experimentId).length;
      const landDetailCount =
        p.landDetailCount && p.landDetailCount > 0
          ? p.landDetailCount
          : lDirect || lExp || 0;

      const sDirect = scheds.filter(
        (x) =>
          x.allocationPlanId === p.allocationPlanId ||
          (x.experimentId === p.experimentId && p.experimentId)
      ).length;
      const scheduleCount =
        p.scheduleCount && p.scheduleCount > 0 ? p.scheduleCount : sDirect || 0;

      return {
        ...p,
        equipmentDetailCount,
        humanDetailCount,
        landDetailCount,
        scheduleCount,
      };
    });
  } catch (err) {
    return plans;
  }
}

export async function getAllocationPlans(params?: {
  ExperimentId?: number;
  ApproveStatus?: string;
  Size?: number;
}): Promise<AllocationPlanItem[]> {
  const res = await client.get("/AllocationPlans", {
    params: {
      Size: 50,
      ...params,
    },
  });
  const rawList = res.data?.data?.items || res.data?.items || res.data?.data || [];
  return enrichAllocationPlans(rawList);
}

export async function getAllocationPlanById(id: number): Promise<AllocationPlanItem> {
  const res = await client.get(`/AllocationPlans/${id}`);
  const rawPlan = res.data?.data || res.data;
  const [enriched] = await enrichAllocationPlans([rawPlan]);
  return enriched || rawPlan;
}

export async function createAllocationPlan(payload: {
  experimentId: number;
  fitnessScore?: number | null;
  approveStatus?: string;
  advantages?: string[];
  disadvantages?: string[];
}): Promise<AllocationPlanItem> {
  const res = await client.post("/AllocationPlans", payload);
  return res.data?.data || res.data;
}

export async function getAllocationPlanEquipment(
  allocationPlanId: number
): Promise<AllocatedEquipmentItem[]> {
  const res = await client.get("/AllocationEquipmentDetails", {
    params: { allocationPlanId, Size: 50 },
  });
  return res.data?.data?.items || res.data?.items || res.data?.data || [];
}

export async function getAllocationPlanHuman(
  allocationPlanId: number
): Promise<AllocatedHumanItem[]> {
  const res = await client.get("/AllocationHumanDetails", {
    params: { allocationPlanId, Size: 50 },
  });
  return res.data?.data?.items || res.data?.items || res.data?.data || [];
}

export async function getAllocationPlanLand(
  allocationPlanId: number
): Promise<AllocatedLandItem[]> {
  const res = await client.get("/AllocationLandDetails", {
    params: { allocationPlanId, Size: 50 },
  });
  return res.data?.data?.items || res.data?.items || res.data?.data || [];
}

export async function approveAllocationPlan(id: number): Promise<any> {
  try {
    const res = await client.post(`/AllocationPlans/${id}/approve`);
    return res.data;
  } catch (err) {
    const res = await client.put(`/AllocationPlans/${id}`, { approveStatus: "Approved" });
    return res.data;
  }
}

export async function rejectAllocationPlan(id: number, reason?: string): Promise<any> {
  try {
    const res = await client.post(`/AllocationPlans/${id}/reject`, { reason });
    return res.data;
  } catch (err) {
    const res = await client.put(`/AllocationPlans/${id}`, { approveStatus: "Rejected", note: reason });
    return res.data;
  }
}

export async function updateAllocationPlan(id: number, payload: any): Promise<any> {
  const res = await client.put(`/AllocationPlans/${id}`, payload);
  return res.data;
}
