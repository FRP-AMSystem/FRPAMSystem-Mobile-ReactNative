export type ScheduleStatus =
  | "Planned"
  | "InProgress"
  | "Completed"
  | "Cancelled";

export interface ScheduleItem {
  scheduleId: number;
  allocationPlanId?: number;
  allocationPlanName?: string | null;
  phaseId?: number | null;
  phaseName?: string | null;
  experimentId?: number;
  experimentName?: string | null;
  title?: string | null;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: ScheduleStatus;
  notes?: string | null;
  priority?: number;
  location?: string | null;
  assignedToUserId?: number | null;
  assignedToUserName?: string | null;
  assignedHumanResourceId?: number | null;
  assignedHumanResourceName?: string | null;
  createdBy?: number | null;
  createdByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
