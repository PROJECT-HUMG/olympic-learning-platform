import type { CreationState } from "@/components/ui/creation-dialog";
import { useEffect, useState } from "react";
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
import { RegistrationVerification } from "./registration-verification";
import { ResumeRegistrationForm } from "./resume-registration-form";
import { TurnstileChallenge } from "./turnstile-challenge";
import { useTurnstileChallenge } from "../hooks/use-turnstile-challenge";
import { readRegistrationSession, storeRegistrationSession } from "../lib/registration-session";
import type { RegistrationChallenge } from "../types/auth.types";

const registerSchema = z
  .object({
    email: z.email("Vui lòng nhập địa chỉ email hợp lệ").max(100, "Email tối đa 100 ký tự"),
    username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự").max(100, "Tên đăng nhập tối đa 100 ký tự"),
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

export function RegisterForm({ onStateChange, onClose }: { onStateChange?: (state: CreationState) => void; onClose?: () => void }) {
  const turnstile = useTurnstileChallenge();
  const location = useLocation();
  const [challenge, setChallenge] = useState<RegistrationChallenge | null>(readRegistrationSession);
  const [showVerification, setShowVerification] = useState(() => challenge !== null);
  const [resuming, setResuming] = useState(() => new URLSearchParams(location.search).get("resume") === "1");
  function updateChallenge(value: RegistrationChallenge | null) {
    setChallenge(value);
    storeRegistrationSession(value);
  }
  const [isUsernameTouched, setIsUsernameTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => { if (!resuming && !(showVerification && challenge)) onStateChange?.({ dirty: isDirty, busy: isSubmitting }); }, [onStateChange, resuming, showVerification, challenge, isDirty, isSubmitting]);
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
      const response = await authService.register({
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        password: data.password,
        turnstileToken: turnstile.token(),
      });
      reset();
      setIsUsernameTouched(false);
      updateChallenge(response.data.verification);
      setShowVerification(true);
      toast.success("Đã tạo tài khoản. Nhập mã trong email để hoàn tất.");
    } catch (err) {
      const apiError = parseApiError(err);
      toast.error(apiError.detail || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      turnstile.reset();
    }
  }

  if (resuming) return <ResumeRegistrationForm onStateChange={onStateChange} onClose={onClose}
    onComplete={(value) => { updateChallenge(value); setShowVerification(true); setResuming(false); }}
    onBack={() => { updateChallenge(null); setShowVerification(false); setResuming(false); }}
  />;

  if (showVerification && challenge) return <RegistrationVerification challenge={challenge} onStateChange={onStateChange} onClose={onClose}
    onUpdate={(value) => { if (value) updateChallenge(value); else storeRegistrationSession(null); }}
    onResume={() => { updateChallenge(null); setShowVerification(false); setResuming(true); }}
  />;

  return (
    <div className="auth-form">
      {!onClose && <div>
        <h1 className="auth-heading">Tạo tài khoản</h1>
        <p className="auth-description">Bắt đầu từ đây.</p>
      </div>}

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

        <TurnstileChallenge action="register" generation={turnstile.generation} onToken={turnstile.receive} />
        <Button type="submit" className="w-full" loading={isSubmitting} disabled={!turnstile.ready}>
          Tạo tài khoản
        </Button>
      </form>

      <Button type="button" variant="ghost" className="w-full" disabled={isSubmitting} onClick={() => setResuming(true)}>
        Đã đăng ký nhưng chưa xác thực?
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link
          to={ROUTES.LOGIN}
          state={location.state}
          onClick={onClose ? event => { event.preventDefault(); onClose(); } : undefined}
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
