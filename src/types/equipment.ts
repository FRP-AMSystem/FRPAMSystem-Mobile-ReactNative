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

export interface EquipmentItem {
  equipmentId: number;
  equipmentCode?: string;
  equipmentName: string;
  typeName?: string;
  typeId?: number;
  status?: string;
  efficiencyScore?: number;
  maintenanceStatus?: string;
  serialNumber?: string;
  createdAt?: string;
}

export interface EquipmentRequest {
  equipmentName: string;
  equipmentCode: string;
  equipmentTypeId: number;
  status?: string;
  efficiencyScore?: number;
  maintenanceStatus?: string;
  serialNumber?: string;
}
