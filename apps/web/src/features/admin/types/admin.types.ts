import type { Role, UserStatus } from "@/features/auth/types/auth.types";

export interface AdminUserResponse {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  role: Role;
  status: UserStatus;
  permissions: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminUsersSearchRequest {
  search?: string;
  page?: number;
  size?: number;
}

export interface Page<T> {
  content: T[];
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PermissionInfo {
  id: string;
  description: string;
}
