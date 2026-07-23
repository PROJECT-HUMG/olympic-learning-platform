import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import { QUERY_KEY_CURRENT_USER } from "@/features/auth/hooks/use-current-user";
import { toast } from "sonner";
import { parseApiError } from "@/lib/api-error";

export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => userService.updateAvatar(file),
    onSuccess: (response) => {
      queryClient.setQueryData(QUERY_KEY_CURRENT_USER, response.data);
      toast.success("Cập nhật ảnh đại diện thành công!");
    },
    onError: (error) => {
      const apiError = parseApiError(error);
      toast.error(apiError.detail || "Cập nhật ảnh đại diện thất bại.");
    },
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.removeAvatar(),
    onSuccess: (response) => {
      queryClient.setQueryData(QUERY_KEY_CURRENT_USER, response.data);
      toast.success("Đã xóa ảnh đại diện.");
    },
    onError: (error) => {
      const apiError = parseApiError(error);
      toast.error(apiError.detail || "Xóa ảnh đại diện thất bại.");
    },
  });
}
