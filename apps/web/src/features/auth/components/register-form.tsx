import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "react-router-dom";
import { authService } from "@/features/auth/services/auth.service";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { toast } from "sonner";
import { MailCheckIcon } from "lucide-react";

const registerSchema = z
  .object({
    email: z.email("Vui lòng nhập địa chỉ email hợp lệ"),
    username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    fullName: z
      .string()
      .min(1, "Vui lòng nhập họ và tên")
      .max(120, "Họ và tên tối đa 120 ký tự"),
    password: z
      .string()
      .min(8, "Mật khẩu phải từ 8 đến 128 ký tự")
      .max(128, "Mật khẩu phải từ 8 đến 128 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const location = useLocation();
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isUsernameTouched, setIsUsernameTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const emailRegister = register("email");
  const usernameRegister = register("username");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    emailRegister.onChange(e);
    const emailValue = e.target.value;
    if (!isUsernameTouched) {
      const atIndex = emailValue.indexOf("@");
      const derivedUsername =
        atIndex !== -1 ? emailValue.substring(0, atIndex) : emailValue;
      setValue("username", derivedUsername, { shouldValidate: true });
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUsernameTouched(true);
    usernameRegister.onChange(e);
  };

  async function onSubmit(data: RegisterFormValues) {
    try {
      await authService.register({
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        password: data.password,
      });
      setRegisteredEmail(data.email);
      setIsRegistered(true);
      toast.success("Đăng ký tài khoản thành công!");
    } catch (err) {
      const apiError = parseApiError(err);
      toast.error(apiError.detail || "Đăng ký thất bại. Vui lòng thử lại.");
    }
  }

  if (isRegistered) {
    return (
      <div className="auth-status" role="status">
        <MailCheckIcon className="auth-status__icon" />
        <h1 className="auth-heading">Còn một bước nữa.</h1>
        <p className="auth-status__message">
          Chúng tôi đã gửi đường link xác thực đến email{" "}
          <span className="font-semibold text-foreground">{registeredEmail}</span>.
          Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.
        </p>
        <Button asChild variant="outline" className="h-11 rounded-full px-6">
          <Link to={ROUTES.LOGIN} state={location.state}>Về đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <div>
        <h1 className="auth-heading">Tạo tài khoản</h1>
        <p className="auth-description">Bắt đầu từ đây.</p>
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          id="register-email"
          type="email"
          label="Email"
          required
          placeholder="user@example.com"
          error={errors.email?.message}
          {...emailRegister}
          onChange={handleEmailChange}
        />

        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
          <FormField
            id="register-username"
            type="text"
            label="Tên đăng nhập"
            required
            placeholder="user123"
            error={errors.username?.message}
            {...usernameRegister}
            onChange={handleUsernameChange}
          />

          <FormField
            id="register-fullName"
            type="text"
            label="Họ và tên"
            required
            placeholder="Nguyễn Văn A"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </div>

        <FormField
          id="register-password"
          type="password"
          label="Mật khẩu"
          required
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <FormField
          id="register-confirmPassword"
          type="password"
          label="Nhập lại mật khẩu"
          required
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Tạo tài khoản
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link
          to={ROUTES.LOGIN}
          state={location.state}
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
