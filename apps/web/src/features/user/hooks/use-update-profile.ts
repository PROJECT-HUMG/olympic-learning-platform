import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import type { UpdateProfileRequest } from "../types/user.types";
import { QUERY_KEY_CURRENT_USER } from "@/features/auth/hooks/use-current-user";
import { toast } from "sonner";
import { parseApiError } from "@/lib/api-error";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => userService.updateProfile(data),
    onSuccess: (response) => {
      queryClient.setQueryData(QUERY_KEY_CURRENT_USER, response.data);
      toast.success("Cập nhật thông tin hồ sơ thành công!");
    },
    onError: (error) => {
      const apiError = parseApiError(error);
      toast.error(apiError.detail || "Cập nhật thông tin hồ sơ thất bại.");
    },
  });
}
