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
import { MailCheckIcon } from "lucide-react";

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
      <div className="space-y-4 text-center">
        <MailCheckIcon className="mx-auto size-14 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Kiểm tra Email của bạn</h1>
        <p className="text-sm text-muted-foreground">
          Chúng tôi đã gửi đường link khôi phục mật khẩu đến{" "}
          <span className="font-semibold text-foreground">{submittedEmail}</span>.
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
        <h1 className="text-2xl font-bold text-foreground">Quên Mật Khẩu?</h1>
        <p className="text-sm text-muted-foreground">
          Nhập địa chỉ email của bạn để nhận liên kết khôi phục mật khẩu.
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Đang gửi yêu cầu..." : "Gửi Link Khôi Phục"}
        </Button>

        <div className="text-center text-sm">
          <Link
            to={ROUTES.LOGIN}
            className="text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Quay lại Đăng nhập
          </Link>
        </div>
      </form>
    </div>
  );
}
