export interface FitnessBreakdown {
  landScore?: number;
  humanScore?: number;
  equipmentScore?: number;
  scheduleScore?: number;
  penaltyScore?: number;
  bonusScore?: number;
  finalScore?: number;
}

export interface ConstraintReport {
  isHardFeasible?: boolean;
  totalConflicts?: number;
  landConflicts?: string[];
  humanConflicts?: string[];
  equipmentConflicts?: string[];
  scheduleConflicts?: string[];
  maintenanceConflicts?: string[];
  skillConflicts?: string[];
  roleConflicts?: string[];
  deadlineConflicts?: string[];
}

export interface OptimizationTimelineItem {
  phaseId?: number;
  phaseName?: string;
  durationDays?: number;
  startDate?: string;
  endDate?: string;
}

export interface OptimizationAllocatedEquipment {
  phaseId?: number;
  phaseName?: string;
  requiredEquipmentTypeId?: number;
  allocatedEquipmentTypeId?: number;
  equipmentTypeName?: string;
  equipmentInstanceId?: number;
  assetCode?: string;
  efficiencyRate?: number;
  isSubstitute?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface OptimizationAllocatedHuman {
  phaseId?: number;
  phaseName?: string;
  roleId?: number;
  roleName?: string;
  humanResourceId?: number;
  fullName?: string;
  skillId?: number;
  skillName?: string;
  startDate?: string;
  endDate?: string;
}

export interface OptimizationAllocatedLand {
  phaseId?: number;
  phaseName?: string;
  landId?: number;
  landCode?: string;
  areaSize?: number;
  soilType?: string;
  startDate?: string;
  endDate?: string;
}

export interface AIOptimizationCandidate {
  rank: number;
  fitnessScore: number;
  penaltyScore?: number;
  bonusScore?: number;
  fitnessBreakdown?: FitnessBreakdown;
  constraintReport?: ConstraintReport;
  conflictCount?: number;
  estimatedCompletionTime?: string;
  estimatedDurationDays?: number;
  advantages?: string[];
  disadvantages?: string[];
  timeline?: OptimizationTimelineItem[];
  allocatedLands?: OptimizationAllocatedLand[];
  allocatedHumans?: OptimizationAllocatedHuman[];
  allocatedEquipment?: OptimizationAllocatedEquipment[];
}
