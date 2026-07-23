import type { Role, UserStatus } from "@/features/auth/types/auth.types";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: Role;
  status: UserStatus;
  lastLoginAt?: string | null;
}

export interface UpdateProfileRequest {
  fullName: string;
}
