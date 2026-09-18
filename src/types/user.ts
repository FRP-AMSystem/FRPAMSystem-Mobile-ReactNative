import { Role } from "./auth";

export interface UserItem {
  userId: number;
  id?: number;
  username: string;
  fullName: string;
  email: string;
  roleId?: number;
  roleName: Role | string;
  isActive?: boolean;
  phoneNumber?: string;
  avatar?: string;
  createdAt?: string;
  department?: string;
}

export interface CreateUserPayload {
  username: string;
  fullName: string;
  email: string;
  password?: string;
  roleId: number;
  roleName?: string;
  phoneNumber?: string;
  department?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  password?: string;
  roleId?: number;
  isActive?: boolean;
  phoneNumber?: string;
  department?: string;
}
