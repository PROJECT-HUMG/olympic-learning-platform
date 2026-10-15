import { useEffect, useRef, useState } from "react";
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
import { LockKeyhole } from "lucide-react";

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
  // A different link starts a fresh form; previous responses cannot own its state.
  return <ResetPasswordFlow key={token ?? ""} token={token} />;
}

function ResetPasswordFlow({ token }: { token: string | null }) {
  const navigate = useNavigate();
  const [requestError, setRequestError] = useState("");
  const [linkFailure, setLinkFailure] = useState<"expired" | "invalid" | null>(null);
  const mounted = useRef(false);
  const failureHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => { if (linkFailure) failureHeading.current?.focus(); }, [linkFailure]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!token) return;
    setRequestError("");
    try {
      await authService.resetPassword({ token, newPassword: data.newPassword });
      if (!mounted.current) return;
      toast.success("Đã đặt mật khẩu mới. Vui lòng đăng nhập lại.");
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      if (!mounted.current) return;
      const apiError = parseApiError(err);
      if (apiError.messageKey === "error.auth.emailTokenExpired") setLinkFailure("expired");
      else if (["error.auth.emailTokenInvalid", "error.auth.emailTokenMissing"].includes(apiError.messageKey ?? "")) setLinkFailure("invalid");
      else setRequestError(apiError.detail || "Chưa đặt được mật khẩu mới. Vui lòng thử lại.");
    }
  }

  if (!token || linkFailure) {
    return (
      <div className="auth-status" role="alert">
        <LockKeyhole className="auth-status__icon auth-status__icon--error" aria-hidden="true" />
        <h1 ref={failureHeading} tabIndex={-1} className="auth-heading outline-none">
          {linkFailure === "expired" ? "Liên kết đã hết hạn" : "Liên kết chưa hợp lệ"}
        </h1>
        <p className="auth-description">
          {!token ? "Liên kết đặt mật khẩu thiếu mã xác thực." : "Liên kết này không còn sử dụng được."}{" "}
          Nếu cần khôi phục mật khẩu, bạn có thể gửi yêu cầu mới.
        </p>
        <Button asChild>
          <Link to={ROUTES.FORGOT_PASSWORD}>Khôi phục mật khẩu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <div>
        <h1 className="auth-heading">Đặt mật khẩu mới</h1>
        <p className="auth-description">Dùng từ 8 đến 128 ký tự để bảo vệ tài khoản của bạn.</p>
      </div>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-busy={isSubmitting}
        aria-describedby={requestError ? "reset-request-error" : undefined}>
        <FormField id="reset-newPassword" type="password" label="Mật khẩu mới" autoComplete="new-password"
          required disabled={isSubmitting} error={errors.newPassword?.message} {...register("newPassword")} />
        <FormField id="reset-confirmPassword" type="password" label="Xác nhận mật khẩu mới" autoComplete="new-password"
          required disabled={isSubmitting} error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        {requestError && <p id="reset-request-error" role="alert" className="text-sm leading-relaxed text-destructive">{requestError}</p>}
        <Button type="submit" className="w-full" loading={isSubmitting}>Lưu mật khẩu mới</Button>
      </form>
    </div>
  );
}
