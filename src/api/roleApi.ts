import client from "./client";
import { RoleItem } from "../types/role";

export async function getRoles(): Promise<RoleItem[]> {
  try {
    const res = await client.get("/Roles", {
      params: { Size: 100 },
    });
    const rawList = res.data?.data?.items || res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
    return rawList.map((r: any) => ({
      roleId: Number(r.roleId ?? r.id ?? 0),
      roleName: String(r.roleName ?? r.name ?? ""),
      name: String(r.roleName ?? r.name ?? ""),
      description: r.description || "",
    }));
  } catch (err) {
    console.error("getRoles error:", err);
    return [];
  }
}
