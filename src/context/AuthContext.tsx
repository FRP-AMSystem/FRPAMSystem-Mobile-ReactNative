import React, { createContext, useContext, useState, useEffect } from "react";
import { UserData, Role } from "../types/auth";
import { getToken, getUser, saveToken, saveUser, clearAuth } from "../utils/storage";
import { decodeJwt } from "../utils/jwt";
import { ALLOWED_MOBILE_ROLES } from "../constants/config";

interface AuthContextType {
  token: string | null;
  user: UserData | null;
  role: Role | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isResearcher: boolean;
  isFieldStaff: boolean;
  loginUser: (token: string, user: UserData) => Promise<{ success: boolean; message?: string }>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAuth() {
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();

        if (storedToken && storedUser) {
          const decoded = decodeJwt(storedToken);
          if (decoded && decoded.exp * 1000 > Date.now()) {
            setToken(storedToken);
            setUser(storedUser);
            setRole(decoded.role || storedUser.roleName);
          } else {
            await clearAuth();
          }
        }
      } catch (err) {
        console.error("Auth load error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAuth();
  }, []);

  const loginUser = async (newToken: string, newUser: UserData) => {
    const decoded = decodeJwt(newToken);
    const userRole = decoded?.role || newUser.roleName;

    // Check Role Gatekeeper
    if (!ALLOWED_MOBILE_ROLES.includes(userRole)) {
      return {
        success: false,
        message: `Tài khoản role "${userRole}" không được phép dùng Mobile App. Vui lòng đăng nhập trên hệ thống Web (chỉ dành cho Technician / Seasonal).`,
      };
    }

    await saveToken(newToken);
    await saveUser({ ...newUser, roleName: userRole });
    setToken(newToken);
    setUser({ ...newUser, roleName: userRole });
    setRole(userRole);

    return { success: true };
  };

  const logoutUser = async () => {
    await clearAuth();
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const isAuthenticated = !!token;
  const isAdmin = !!role && (role === "Admin" || role === "SystemAdmin");
  const isManager = role === "Manager";
  const isResearcher = role === "Researcher";
  const isFieldStaff = !!role && ["Technician", "Seasonal", "Student"].includes(role);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isLoading,
        isAuthenticated,
        isAdmin,
        isManager,
        isResearcher,
        isFieldStaff,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
