export type ExperimentStatus =
  | "Draft"
  | "Created"
  | "Pending"
  | "Approved"
  | "Running"
  | "Completed"
  | "Rejected"
  | "Cancelled";

export type PriorityLevel = "0" | "1" | "2" | "3"; // 0: Low, 1: Medium, 2: High, 3: Urgent

export interface ExperimentItem {
  experimentId: number;
  experimentName: string;
  description?: string | null;
  researcherId?: number;
  researcherName?: string | null;
  expectStartDate?: string | null;
  expectEndDate?: string | null;
  deadline?: string | null;
  priority?: PriorityLevel | number | string | null;
  status: ExperimentStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateExperimentRequest {
  experimentName: string;
  description?: string | null;
  expectStartDate: string;
  expectEndDate: string;
  deadline: string;
  priority?: string | number;
}

export interface ExperimentPhaseItem {
  experimentPhaseId?: number;
  experimentId: number;
  phaseName: string;
  phaseDescription?: string | null;
  phaseOrder: number;
  expectedStartDate: string;
  expectedEndDate: string;
  status?: "Planned" | "InProgress" | "Completed" | "Cancelled";
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ExperimentEquipmentRequirementItem {
  expEquipmentReqId?: number;
  experimentId: number;
  equipmentTypeId: number;
  equipmentTypeName?: string;
  quantity: number;
  allowSubstitute?: boolean;
  minAcceptableEfficiency?: number | null; // 0.0 - 1.0 or percentage
  note?: string | null;
  createdAt?: string | null;
}

export interface ExperimentHumanRequirementItem {
  expHumanReqId?: number;
  experimentId: number;
  roleId: number;
  roleName?: string;
  requiredSkillId?: number | null;
  requiredSkillName?: string;
  quantity: number;
  workingHoursPerDay?: number | null;
  note?: string | null;
  createdAt?: string | null;
}

export interface ExperimentLandRequirementItem {
  expLandReqId?: number;
  experimentId: number;
  requiredArea: number;
  requiredSoilType?: string | null;
  note?: string | null;
  createdAt?: string | null;
}
