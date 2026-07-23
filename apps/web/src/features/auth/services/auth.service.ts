import { apiClient } from "@/lib/axios";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshAccessTokenResponse,
  AuthMessageResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  CurrentUser,
} from "@/features/auth/types/auth.types";

export const authService = {
  login(data: LoginRequest) {
    return apiClient.post<LoginResponse>("/auth/login", data);
  },

  register(data: RegisterRequest) {
    return apiClient.post<RegisterResponse>("/auth/register", data);
  },

  refresh() {
    return apiClient.post<RefreshAccessTokenResponse>("/auth/refresh");
  },

  logout() {
    return apiClient.post<void>("/auth/logout");
  },

  verifyEmail(data: VerifyEmailRequest) {
    return apiClient.post<AuthMessageResponse>("/auth/verify-email", data);
  },

  forgotPassword(data: ForgotPasswordRequest) {
    return apiClient.post<AuthMessageResponse>("/auth/password/forgot", data);
  },

  resetPassword(data: ResetPasswordRequest) {
    return apiClient.post<AuthMessageResponse>("/auth/password/reset", data);
  },

  me() {
    return apiClient.get<CurrentUser>("/users/me");
  },
};
