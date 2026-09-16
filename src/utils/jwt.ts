import { Role } from "../types/auth";

export interface DecodedToken {
  userId: number;
  role: Role;
  fullName: string;
  email: string;
  exp: number;
}

export function decodeJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    
    // Base64Url decode
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);

    const role = (
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      payload.role ||
      "Seasonal"
    ) as Role;

    const userId = Number(
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
      payload.nameid ||
      0
    );

    const fullName =
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      payload.unique_name ||
      "";

    const email =
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
      payload.email ||
      "";

    return {
      userId,
      role,
      fullName,
      email,
      exp: payload.exp || 0,
    };
  } catch (err) {
    console.error("Failed to decode token:", err);
    return null;
  }
}
