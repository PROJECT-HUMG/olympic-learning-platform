import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/use-auth-store";
import { ApiError, parseApiError } from "@/lib/api-error";
import { queryClient } from "@/lib/query-client";
import { expireAuthSession } from "@/lib/auth-session";
import { createSessionRefresh } from "@/lib/session-refresh";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true,
});

type SessionRequest = InternalAxiosRequestConfig & { _retry?: boolean; _sessionRevision?: number };

apiClient.interceptors.request.use(
  (config) => {
    const { accessToken: token, revision } = useAuthStore.getState();
    (config as SessionRequest)._sessionRevision = revision;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else delete config.headers.Authorization;
    return config;
  },
  (error) => Promise.reject(error),
);

const refreshSession = createSessionRefresh({
  getSession: () => useAuthStore.getState(),
  requestToken: async () => {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
      withCredentials: true,
      timeout: 15000,
    });
    const token: unknown = response.data.accessToken;
    if (typeof token !== "string" || !token.trim()) {
      throw new ApiError({ status: 502, detail: "Chưa nhận được phiên đăng nhập mới. Vui lòng thử lại." });
    }
    return token;
  },
  setToken: (token) => useAuthStore.getState().setAccessToken(token),
  expire: () => expireAuthSession(queryClient, useAuthStore.getState().clearAuth),
  normalizeError: parseApiError,
  expiredError: () => new ApiError({ status: 401, messageKey: "error.auth.refreshExpired" }),
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as SessionRequest | undefined;
    const requestUrl = originalRequest?.url || "";

    // Don't attempt refresh for auth endpoints — 401 here means invalid credentials, not expired token
    const isAuthRequest = requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/registration/") ||
      requestUrl.includes("/auth/refresh") || requestUrl.includes("/auth/logout");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        const session = useAuthStore.getState();
        // A late 401 from the previous token must reuse the newer session, not rotate it again.
        const changedSession = originalRequest._sessionRevision !== session.revision;
        if (changedSession && !session.accessToken) {
          throw new ApiError({ status: 401, messageKey: "error.auth.refreshExpired" });
        }
        const newToken = changedSession && session.accessToken ? session.accessToken : await refreshSession();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(parseApiError(refreshError));
      }
    }

    return Promise.reject(parseApiError(error));
  },
);
