export type Role = "STUDENT" | "LECTURER" | "ADMIN";
export type UserStatus = "PENDING" | "ACTIVE" | "DISABLED";

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  role: Role;
  status: UserStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: CurrentUser;
}

export interface RegisterRequest {
  email: string;
  username: string;
  fullName: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  messageKey: string;
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
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}
