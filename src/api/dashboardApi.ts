import { getExperiments } from "./experimentApi";
import { getAllocationPlans } from "./allocationPlanApi";
import { getEquipments } from "./equipmentApi";
import { getLands } from "./landApi";
import { getUsers } from "./userApi";

export interface DashboardMetrics {
  totalExperiments: number;
  runningExperiments: number;
  pendingExperiments: number;
  completedExperiments: number;
  totalAllocationPlans: number;
  pendingAllocationPlans: number;
  totalEquipment: number;
  inUseEquipment: number;
  maintenanceEquipment: number;
  totalLands: number;
  totalStaff: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [exps, plans, equips, lands, users] = await Promise.allSettled([
    getExperiments({ Size: 100 }),
    getAllocationPlans({ Size: 100 }),
    getEquipments({ Size: 100 }),
    getLands({ Size: 100 }),
    getUsers({ Size: 100 }),
  ]);

  const experimentList = exps.status === "fulfilled" ? exps.value : [];
  const planList = plans.status === "fulfilled" ? plans.value : [];
  const equipList = equips.status === "fulfilled" ? equips.value : [];
  const landList = lands.status === "fulfilled" ? lands.value : [];
  const userList = users.status === "fulfilled" ? users.value : [];

  const runningExp = experimentList.filter((e) =>
    ["running", "in_progress", "active", "approved"].includes(
      (e.status || "").toLowerCase()
    )
  ).length;

  const pendingExp = experimentList.filter((e) =>
    ["submitted", "under_review", "pending", "draft"].includes(
      (e.status || "").toLowerCase()
    )
  ).length;

  const completedExp = experimentList.filter((e) =>
    ["completed", "finished", "success"].includes(
      (e.status || "").toLowerCase()
    )
  ).length;

  const pendingPlans = planList.filter((p) =>
    ["pending", "draft", "optimized", "submitted"].includes(
      (p.approveStatus || "").toLowerCase()
    )
  ).length;

  const inUseEquip = equipList.filter((eq: any) =>
    ["inuse", "in_use", "assigned", "busy"].includes(
      (eq.status || "").toLowerCase()
    )
  ).length;

  const maintEquip = equipList.filter((eq: any) =>
    ["maintenance", "repair", "broken"].includes(
      (eq.status || "").toLowerCase()
    )
  ).length;

  return {
    totalExperiments: experimentList.length,
    runningExperiments: runningExp,
    pendingExperiments: pendingExp,
    completedExperiments: completedExp,
    totalAllocationPlans: planList.length,
    pendingAllocationPlans: pendingPlans,
    totalEquipment: equipList.length,
    inUseEquipment: inUseEquip,
    maintenanceEquipment: maintEquip,
    totalLands: landList.length,
    totalStaff: userList.length,
  };
}
