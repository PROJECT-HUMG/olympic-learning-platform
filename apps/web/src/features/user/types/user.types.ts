import type { Role, UserStatus } from "@/features/auth/types/auth.types";

export interface AvatarCrop { x: number; y: number; zoom: number }

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  avatarCrop?: AvatarCrop | null;
  role: Role;
  status: UserStatus;
  lastLoginAt?: string | null;
}

export interface UpdateProfileRequest {
  fullName: string;
}
