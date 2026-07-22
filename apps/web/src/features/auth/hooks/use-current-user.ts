import { useQuery } from "@tanstack/react-query";
import { authService } from "@/features/auth/services/auth.service";

export const QUERY_KEY_CURRENT_USER = ["auth", "currentUser"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: QUERY_KEY_CURRENT_USER,
    queryFn: async () => {
      const response = await authService.me();
      return response.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
