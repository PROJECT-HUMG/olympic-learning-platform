import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import { QUERY_KEY_CURRENT_USER } from "@/features/auth/hooks/use-current-user";
import { toast } from "sonner";
import { parseApiError } from "@/lib/api-error";
import type { AvatarCrop, UserProfile } from "../types/user.types";

function updateAvatarCache(client: QueryClient, user: UserProfile) {
  client.setQueryData(QUERY_KEY_CURRENT_USER, user);
  void client.invalidateQueries({
    predicate: ({ queryKey }) => ["posts", "documents", "study-room"].includes(String(queryKey[0]))
      || (queryKey[0] === "admin" && queryKey[1] === "users"),
  });
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, crop }: { file: File; crop: AvatarCrop }) => userService.updateAvatar(file, crop),
    onSuccess: (response) => {
      updateAvatarCache(queryClient, response.data);
      toast.success("Cập nhật ảnh đại diện thành công!");
    },
    onError: (error) => {
      const apiError = parseApiError(error);
      toast.error(apiError.detail || "Cập nhật ảnh đại diện thất bại.");
    },
  });
}

export function useUpdateAvatarCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (crop: AvatarCrop) => userService.updateAvatarCrop(crop),
    onSuccess: (response) => {
      updateAvatarCache(queryClient, response.data);
      toast.success("Đã cập nhật khung ảnh đại diện.");
    },
    onError: (error) => {
      toast.error(parseApiError(error).detail || "Chưa lưu được khung ảnh. Thử lại.");
    },
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.removeAvatar(),
    onSuccess: (response) => {
      updateAvatarCache(queryClient, response.data);
      toast.success("Đã xóa ảnh đại diện.");
    },
    onError: (error) => {
      const apiError = parseApiError(error);
      toast.error(apiError.detail || "Xóa ảnh đại diện thất bại.");
    },
  });
}
