import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/use-auth-store";
import { authService } from "@/features/auth/services/auth.service";
import { ROUTES } from "@/router/route-constants";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY_CURRENT_USER } from "./use-current-user";

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAccessToken, clearAuth } = useAuthStore();

  async function login(email: string, password: string) {
    const response = await authService.login({ email, password });
    
    // Set token for interceptors
    setAccessToken(response.data.accessToken);
    
    // Pre-populate user cache from login response
    queryClient.setQueryData(QUERY_KEY_CURRENT_USER, response.data.user);
    
    navigate(ROUTES.DASHBOARD, { replace: true });
  }

  async function logout() {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      queryClient.clear(); // Clear all user data from cache
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }

  return { login, logout };
}
