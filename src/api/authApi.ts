import client from "./client";
import { LoginRequest, LoginResponse, UserData } from "../types/auth";

export async function login(payload: LoginRequest): Promise<{ token: string; user: UserData }> {
  const res = await client.post<LoginResponse>("/Auth/login", payload);
  if (res.data && res.data.success && res.data.data) {
    const d = res.data.data;
    return {
      token: d.accessToken,
      user: {
        userId: d.userId,
        username: d.username,
        fullName: d.fullName,
        email: d.email,
        roleName: d.roleName,
      },
    };
  }
  throw new Error(res.data?.message || "Đăng nhập thất bại");
}
