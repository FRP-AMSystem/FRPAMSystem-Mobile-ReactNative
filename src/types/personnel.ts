export type HumanResourceStatus = "Available" | "Busy" | "Unavailable" | "Inactive";

export interface HumanResourceProfile {
  humanResourceId: number;
  userId: number;
  fullName: string | null;
  username: string | null;
  email: string | null;
  roleId: number | null;
  roleName: string | null;
  maxWorkingHoursPerDay: number;
  currentWorkload: number;
  status: HumanResourceStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface HumanResourceProfileRequest {
  userId?: number;
  maxWorkingHoursPerDay: number;
  currentWorkload: number;
  status: HumanResourceStatus;
}
