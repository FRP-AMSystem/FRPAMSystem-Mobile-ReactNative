export type AllocationPlanStatus =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";

export interface AllocationPlanItem {
  allocationPlanId: number;
  experimentId: number;
  experimentName?: string | null;
  fitnessScore?: number | null;
  createdBy?: number;
  createdByName?: string | null;
  approveBy?: number | null;
  approveByName?: string | null;
  approveStatus: AllocationPlanStatus;
  approvedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  landDetailCount?: number;
  equipmentDetailCount?: number;
  humanDetailCount?: number;
  scheduleCount?: number;
  advantages?: string[] | null;
  disadvantages?: string[] | null;
}

export interface AllocatedEquipmentItem {
  allocationEquipmentDetailId: number;
  allocatedEquipmentTypeId: number;
  allocatedEquipmentTypeName?: string | null;
  equipmentInstanceId?: number | null;
  assetCode?: string | null;
  quantity?: number;
  isSubstitute?: boolean;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface AllocatedHumanItem {
  allocationHumanDetailId: number;
  humanResourceId: number;
  humanResourceName?: string | null;
  workingHours?: number;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface AllocatedLandItem {
  allocationLandDetailId: number;
  landId: number;
  landName?: string | null;
  areaName?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}
