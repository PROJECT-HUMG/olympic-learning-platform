import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "react-router-dom";
import { authService } from "@/features/auth/services/auth.service";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { MailCheckIcon } from "lucide-react";
import { TurnstileChallenge } from "./turnstile-challenge";
import { useTurnstileChallenge } from "../hooks/use-turnstile-challenge";

const forgotPasswordSchema = z.object({
  email: z.email("Vui lòng nhập địa chỉ email hợp lệ"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const turnstile = useTurnstileChallenge();
  const location = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [requestError, setRequestError] = useState("");
  const receiptHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (isSubmitted) receiptHeading.current?.focus(); }, [isSubmitted]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setRequestError("");
    try {
      await authService.forgotPassword({ ...data, turnstileToken: turnstile.token() });
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (err) {
      const apiError = parseApiError(err);
      setRequestError(apiError.detail || "Chưa gửi được yêu cầu khôi phục. Vui lòng thử lại.");
    } finally {
      turnstile.reset();
    }
  }

  if (isSubmitted) {
    return (
      <div className="auth-status" role="status">
        <MailCheckIcon className="auth-status__icon" aria-hidden="true" />
        <h1 ref={receiptHeading} tabIndex={-1} className="auth-heading outline-none">Kiểm tra hộp thư</h1>
        <p className="auth-description">
          Nếu có tài khoản sử dụng email{" "}
          <span className="font-semibold text-foreground">{submittedEmail}</span>, bạn sẽ nhận được hướng dẫn khôi phục mật khẩu. Hãy kiểm tra cả mục thư rác.
        </p>
        <Button asChild variant="outline">
          <Link to={ROUTES.LOGIN} state={location.state}>Về đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <div>
        <h1 className="auth-heading">Quên mật khẩu?</h1>
        <p className="auth-description">
          Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-busy={isSubmitting}
        aria-describedby={requestError ? "forgot-request-error" : undefined}>
        <FormField
          id="forgot-email"
          type="email"
          label="Email"
          autoComplete="email"
          disabled={isSubmitting}
          required
          placeholder="user@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <TurnstileChallenge action="password_reset" generation={turnstile.generation} onToken={turnstile.receive} />
        {requestError && <p id="forgot-request-error" role="alert" className="text-sm leading-relaxed text-destructive">{requestError}</p>}
        <Button type="submit" className="w-full" loading={isSubmitting} disabled={!turnstile.ready}>
          Gửi liên kết khôi phục
        </Button>
      </form>
    </div>
  );
}
