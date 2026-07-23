import { useQuery } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import { QUERY_KEY_CURRENT_USER } from "@/features/auth/hooks/use-current-user";

export function useUserProfile() {
  return useQuery({
    queryKey: QUERY_KEY_CURRENT_USER,
    queryFn: async () => {
      const response = await userService.me();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
