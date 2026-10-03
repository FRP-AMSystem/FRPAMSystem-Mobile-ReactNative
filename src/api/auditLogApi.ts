import client from "./client";
import { AuditLogItem, AuditLogResponse } from "../types/auditLog";

export async function getAuditLogs(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  module?: string;
  Size?: number;
  Page?: number;
}): Promise<AuditLogResponse> {
  try {
    const page = params?.page ?? params?.Page ?? 1;
    const pageSize = params?.pageSize ?? params?.Size ?? 50;

    const res = await client.get("/AuditLogs", {
      params: {
        page,
        pageSize,
        search: params?.search?.trim() || undefined,
        module: params?.module && params?.module !== "ALL" ? params.module : undefined,
      },
    });

    const data = res.data?.data || res.data;
    const rawList = data?.items || (Array.isArray(data) ? data : []);
    const total = Number(data?.total ?? data?.totalCount ?? rawList.length);
    const totalPages = Number(data?.totalPages ?? Math.ceil(total / pageSize) ?? 1);

    const items: AuditLogItem[] = rawList.map((m: any) => {
      const rawId = Number(m.auditLogId ?? m.id ?? 0);
      const actorName = m.actorFullName || m.userFullName || m.actorUsername || m.username || "";
      return {
        auditLogId: rawId,
        id: rawId,
        actorId: m.actorId ? Number(m.actorId) : m.userId ? Number(m.userId) : null,
        actorUsername: m.actorUsername || m.username || null,
        actorFullName: m.actorFullName || m.userFullName || null,
        actorRoleName: m.actorRoleName || m.roleName || null,
        module: m.module || "General",
        action: m.action || "Execute",
        severity: m.severity || "INFO",
        description: m.description || m.details || "",
        metadata: m.metadata || null,
        createdAt: m.createdAt || m.timestamp || new Date().toISOString(),

        // Aliases
        username: m.actorUsername || m.username || actorName,
        userFullName: m.actorFullName || m.userFullName || actorName,
        timestamp: m.createdAt || m.timestamp || new Date().toISOString(),
        details: m.description || m.details || "",
      };
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (err) {
    console.error("getAuditLogs error:", err);
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    };
  }
}

export async function getAuditLogById(id: number): Promise<AuditLogItem> {
  const res = await client.get(`/AuditLogs/${id}`);
  const m = res.data?.data || res.data;
  const rawId = Number(m.auditLogId ?? m.id ?? id);
  return {
    auditLogId: rawId,
    id: rawId,
    actorId: m.actorId ? Number(m.actorId) : m.userId ? Number(m.userId) : null,
    actorUsername: m.actorUsername || m.username || null,
    actorFullName: m.actorFullName || m.userFullName || null,
    actorRoleName: m.actorRoleName || m.roleName || null,
    module: m.module || "General",
    action: m.action || "Execute",
    severity: m.severity || "INFO",
    description: m.description || m.details || "",
    metadata: m.metadata || null,
    createdAt: m.createdAt || m.timestamp || new Date().toISOString(),
    username: m.actorUsername || m.username || "",
    userFullName: m.actorFullName || m.userFullName || "",
    timestamp: m.createdAt || m.timestamp || new Date().toISOString(),
    details: m.description || m.details || "",
  };
}
