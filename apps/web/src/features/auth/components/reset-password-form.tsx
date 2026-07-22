import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { authService } from "@/features/auth/services/auth.service";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(128, "Mật khẩu tối đa 128 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!token) {
      toast.error("Mã khôi phục không hợp lệ hoặc đã hết hạn.");
      return;
    }

    try {
      await authService.resetPassword({
        token,
        newPassword: data.newPassword,
      });
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      const apiError = parseApiError(err);
      toast.error(apiError.detail || "Đặt lại mật khẩu thất bại.");
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Liên Kết Không Hợp Lệ</h1>
        <p className="text-sm text-muted-foreground">
          Đường dẫn đặt lại mật khẩu thiếu mã xác thực hợp lệ.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link to={ROUTES.LOGIN}>Quay lại Đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">Đặt Lại Mật Khẩu</h1>
        <p className="text-sm text-muted-foreground">
          Nhập mật khẩu mới của bạn bên dưới.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          id="reset-newPassword"
          type="password"
          label="Mật khẩu mới"
          required
          placeholder="••••••••"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />

        <FormField
          id="reset-confirmPassword"
          type="password"
          label="Xác nhận mật khẩu mới"
          required
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Đang cập nhật..." : "Cập Nhật Mật Khẩu"}
        </Button>
      </form>
    </div>
  );
}
