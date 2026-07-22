import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SocialLoginButtons } from "@/features/auth/components/social-login-buttons";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.email("Vui lòng nhập địa chỉ email hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      await login(data.email, data.password);
      toast.success("Đăng nhập thành công! Chào mừng bạn quay trở lại.");
    } catch (err) {
      const apiError = parseApiError(err);
      toast.error(apiError.detail || "Email hoặc mật khẩu không chính xác.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">Đăng Nhập</h1>
        <p className="text-sm text-muted-foreground">
          Nhập thông tin tài khoản của bạn để tiếp tục
        </p>
      </div>

      <SocialLoginButtons />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          id="login-email"
          type="email"
          label="Email"
          required
          placeholder="user@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <FormField
          id="login-password"
          type="password"
          label="Mật khẩu"
          labelRight={
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Quên mật khẩu?
            </Link>
          }
          required
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập..." : "Đăng Nhập"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link
            to={ROUTES.REGISTER}
            className="font-medium text-primary hover:underline underline-offset-4"
          >
            Đăng ký ngay
          </Link>
        </div>
      </form>
    </div>
  );
}
