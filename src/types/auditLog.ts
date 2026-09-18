export interface AuditLogItem {
  auditLogId?: number;
  id?: number;
  userId?: number;
  username?: string;
  userFullName?: string;
  roleName?: string;
  action: string;
  module: string;
  details?: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  timestamp: string;
  createdAt?: string;
  severity?: "Info" | "Warning" | "Error" | "Critical" | string;
  isSuccess?: boolean;
}
