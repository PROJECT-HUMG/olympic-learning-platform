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

/** Basic public attribution. Account DTOs must not be passed to public identity UI. */
export interface PublicUserIdentity {
  id: string;
  fullName: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  avatarCrop?: AvatarCrop | null;
  profileAvailable?: boolean;
}
