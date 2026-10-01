import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SocialLoginButtons } from "@/features/auth/components/social-login-buttons";
import { toast } from "sonner";

const loginSchema = z.object({
  identifier: z.string().min(1, "Vui lòng nhập Email hoặc Tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      await login(data.identifier, data.password);
      toast.success("Đăng nhập thành công! Chào mừng bạn quay trở lại.");
    } catch (err) {
      const apiError = parseApiError(err);
      toast.error(apiError.detail || "Email, Tên đăng nhập hoặc mật khẩu không chính xác.");
    }
  }

  return (
    <div className="auth-form">
      <div>
        <h1 className="auth-heading auth-heading--greeting">Chào bạn trở lại.</h1>
        <p className="auth-description">
          Đăng nhập để tiếp tục việc học của bạn.
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          id="login-identifier"
          type="text"
          label="Email hoặc Tên đăng nhập"
          required
          placeholder="user@example.com hoặc username"
          error={errors.identifier?.message}
          {...register("identifier")}
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

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Đăng nhập
        </Button>
      </form>

      <SocialLoginButtons />

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link
          to={ROUTES.REGISTER}
          state={location.state}
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Tạo tài khoản
        </Link>
      </p>
    </div>
  );
}
