import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { authService } from "@/features/auth/services/auth.service";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { toast } from "sonner";
import { KeyRound, MailCheckIcon } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.email("Vui lòng nhập địa chỉ email hợp lệ"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    try {
      await authService.forgotPassword(data);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      toast.success("Đã gửi hướng dẫn khôi phục mật khẩu vào email của bạn!");
    } catch (err) {
      const apiError = parseApiError(err);
      toast.error(apiError.detail || "Gửi yêu cầu khôi phục thất bại.");
    }
  }

  if (isSubmitted) {
    return (
      <div className="auth-status" role="status">
        <MailCheckIcon className="auth-status__icon" />
        <h1 className="auth-heading">Kiểm tra hộp thư nhé.</h1>
        <p className="auth-status__message">
          Chúng tôi đã gửi đường link khôi phục mật khẩu đến{" "}
          <span className="font-semibold text-foreground">{submittedEmail}</span>.
        </p>
        <Button asChild variant="outline" className="h-11 rounded-full px-6">
          <Link to={ROUTES.LOGIN}>Về đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <KeyRound className="auth-status__icon" />
      <div>
        <h1 className="auth-heading">Quên mật khẩu?</h1>
        <p className="auth-description">
          Nhập email đã đăng ký. Chúng mình sẽ gửi bạn liên kết để đặt lại mật khẩu.
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          id="forgot-email"
          type="email"
          label="Email"
          required
          placeholder="user@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Gửi liên kết khôi phục
        </Button>
      </form>
    </div>
  );
}
