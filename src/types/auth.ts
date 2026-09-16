export type Role =
  | "Admin"
  | "Manager"
  | "Researcher"
  | "Technician"
  | "Seasonal"
  | "Student";

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface UserData {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  roleName: Role;
  avatar?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    userId: number;
    username: string;
    fullName: string;
    email: string;
    roleName: Role;
  };
}
