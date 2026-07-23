import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import type { ChangePasswordRequest } from "../types/auth.types";
import { toast } from "sonner";
import { parseApiError } from "@/lib/api-error";

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data),
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công! Mật khẩu mới của bạn đã có hiệu lực.");
    },
    onError: (error) => {
      const apiError = parseApiError(error);
      toast.error(apiError.detail || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.");
    },
  });
}
