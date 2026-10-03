import type { AvatarCrop } from "@/features/user/types/user.types";
export type Role = "STUDENT" | "LECTURER" | "ADMIN";
export type UserStatus = "PENDING" | "ACTIVE" | "DISABLED";

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  avatarCrop?: AvatarCrop | null;
  role: Role;
  status: UserStatus;
  lastLoginAt?: string | null;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: CurrentUser;
}

export interface RegisterRequest {
  turnstileToken?: string;
  email: string;
  username: string;
  fullName: string;
  password: string;
}

export interface RegistrationChallenge {
  verificationSession: string;
  email: string;
  expiresAt: string;
  resendAvailableAt: string;
  sessionExpiresAt: string;
}

export interface RegisterResponse {
  message: string;
  messageKey: string;
  verification: RegistrationChallenge;
}

export interface RefreshAccessTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthMessageResponse {
  message: string;
  messageKey: string;
}

export interface ForgotPasswordRequest {
  turnstileToken?: string;
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
