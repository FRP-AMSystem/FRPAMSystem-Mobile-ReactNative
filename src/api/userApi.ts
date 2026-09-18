import client from "./client";
import { UserItem, CreateUserPayload, UpdateUserPayload } from "../types/user";

export async function getUsers(params?: {
  Keyword?: string;
  Role?: string;
  Page?: number;
  Size?: number;
}): Promise<UserItem[]> {
  try {
    const res = await client.get("/Users", {
      params: {
        Size: 100,
        ...params,
      },
    });
    const rawList =
      res.data?.data?.items ||
      res.data?.items ||
      res.data?.data ||
      (Array.isArray(res.data) ? res.data : []);

    return rawList.map((item: any) => {
      const isAct =
        item.isActive !== undefined
          ? Boolean(item.isActive)
          : item.is_active !== undefined
          ? Boolean(item.is_active)
          : item.status !== undefined
          ? String(item.status).toLowerCase() === "active"
          : true;

      return {
        userId: Number(item.userId ?? item.id ?? 0),
        id: Number(item.userId ?? item.id ?? 0),
        username: item.username || item.userName || "",
        fullName: item.fullName || item.full_name || item.username || "User",
        email: item.email || "",
        roleId: item.roleId
          ? Number(item.roleId)
          : item.role?.roleId
          ? Number(item.role.roleId)
          : undefined,
        roleName:
          item.roleName ||
          item.role_name ||
          item.role?.roleName ||
          item.role?.name ||
          "User",
        isActive: isAct,
        phoneNumber: item.phoneNumber || item.phone_number || "",
        avatar: item.avatar || "",
        department: item.department || "",
        createdAt: item.createdAt || item.created_at || null,
      };
    });
  } catch (err) {
    console.error("getUsers error:", err);
    return [];
  }
}

export async function getUserById(id: number): Promise<UserItem> {
  const res = await client.get(`/Users/${id}`);
  const item = res.data?.data || res.data;
  const isAct =
    item.isActive !== undefined
      ? Boolean(item.isActive)
      : item.is_active !== undefined
      ? Boolean(item.is_active)
      : item.status !== undefined
      ? String(item.status).toLowerCase() === "active"
      : true;

  return {
    userId: Number(item.userId ?? item.id ?? 0),
    id: Number(item.userId ?? item.id ?? 0),
    username: item.username || item.userName || "",
    fullName: item.fullName || item.full_name || item.username || "User",
    email: item.email || "",
    roleId: item.roleId
      ? Number(item.roleId)
      : item.role?.roleId
      ? Number(item.role.roleId)
      : undefined,
    roleName:
      item.roleName ||
      item.role_name ||
      item.role?.roleName ||
      item.role?.name ||
      "User",
    isActive: isAct,
    phoneNumber: item.phoneNumber || item.phone_number || "",
    avatar: item.avatar || "",
    department: item.department || "",
    createdAt: item.createdAt || item.created_at || null,
  };
}

export async function createUser(payload: CreateUserPayload): Promise<UserItem> {
  const res = await client.post("/Users", payload);
  return res.data?.data || res.data;
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<UserItem> {
  const res = await client.put(`/Users/${id}`, payload);
  return res.data?.data || res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await client.delete(`/Users/${id}`);
}
