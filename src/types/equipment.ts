export type AllocationDetailStatus =
  | "Proposed"
  | "Reserved"
  | "Allocated"
  | "InUse"
  | "Completed"
  | "Cancelled";

export type EquipmentConditionLevel =
  | "New"
  | "Good"
  | "Fair"
  | "Poor"
  | "Critical"
  | "Damaged";

export interface AllocationEquipmentDetail {
  allocationEquipmentDetailId: number;
  allocationPlanId: number;
  experimentId: number;
  experimentName?: string | null;
  phaseId?: number | null;
  phaseName?: string | null;
  requestedEquipmentTypeId?: number | null;
  requestedEquipmentTypeName?: string | null;
  allocatedEquipmentTypeId: number;
  allocatedEquipmentTypeName?: string | null;
  trackingType?: string | null;
  equipmentInstanceId?: number | null;
  assetCode?: string | null;
  serialNumber?: string | null;
  quantity: number;
  isSubstitute: boolean;
  efficiencyRate: number;
  startDate: string;
  endDate: string;
  status: AllocationDetailStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}
