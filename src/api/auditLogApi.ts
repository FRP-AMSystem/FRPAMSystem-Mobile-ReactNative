import client from "./client";
import { AuditLogItem } from "../types/auditLog";

export async function getAuditLogs(params?: {
  Module?: string;
  Action?: string;
  Severity?: string;
  Search?: string;
  Page?: number;
  Size?: number;
}): Promise<AuditLogItem[]> {
  try {
    const res = await client.get("/AuditLogs", {
      params: {
        Size: 100,
        ...params,
      },
    });
    return res.data?.data?.items || res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    console.error("getAuditLogs error:", err);
    return [];
  }
}

export async function getAuditLogById(id: number): Promise<AuditLogItem> {
  const res = await client.get(`/AuditLogs/${id}`);
  return res.data?.data || res.data;
}
