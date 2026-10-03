export interface AuditLogItem {
  auditLogId: number;
  actorId?: number | null;
  actorUsername?: string | null;
  actorFullName?: string | null;
  actorRoleName?: string | null;
  module: string;
  action: string;
  severity?: string;
  description?: string | null;
  metadata?: string | null;
  createdAt: string;

  // Backwards-compat aliases
  id?: number;
  userFullName?: string;
  username?: string;
  roleName?: string;
  timestamp?: string;
  details?: string;
}

export interface AuditLogResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
