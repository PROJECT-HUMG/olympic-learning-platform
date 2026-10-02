import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authService } from "../services/auth.service";
import type { RegistrationChallenge } from "../types/auth.types";
import { parseApiError } from "@/lib/api-error";
import { ROUTES } from "@/router/route-constants";

const schema = z.object({
  identifier: z.string().trim().min(1, "Nhập email hoặc tên đăng nhập đã đăng ký").max(100),
  password: z.string().min(1, "Nhập mật khẩu đã tạo").max(128),
});
type Values = z.infer<typeof schema>;

export function ResumeRegistrationForm({ onComplete, onBack }: {
  onComplete: (value: RegistrationChallenge) => void;
  onBack: () => void;
}) {
  const location = useLocation();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: (location.state as { registrationIdentifier?: string } | null)?.registrationIdentifier ?? "", password: "" },
  });
  async function submit(values: Values) {
    setError("");
    try {
      const response = await authService.resumeRegistration(values);
      onComplete(response.data);
    } catch (err) {
      setError(parseApiError(err).detail);
    }
  }
  return (
    <div className="auth-form">
      <div>
        <h1 className="auth-heading">Tiếp tục xác thực</h1>
        <p className="auth-description">Nhập thông tin đã đăng ký để nhận mã mới. Nếu email bị nhập nhầm, bạn có thể dùng tên đăng nhập rồi sửa email ở bước tiếp theo.</p>
      </div>
      <form noValidate className="space-y-4" onSubmit={handleSubmit(submit)}>
        <FormField id="resume-identifier" label="Email hoặc tên đăng nhập" autoComplete="username" maxLength={100} error={errors.identifier?.message} {...register("identifier")} disabled={isSubmitting} />
        <FormField id="resume-password" label="Mật khẩu đã tạo" type="password" autoComplete="current-password" maxLength={128} error={errors.password?.message} {...register("password")} disabled={isSubmitting} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" loading={isSubmitting}>Nhận mã xác thực</Button>
      </form>
      <div className="flex flex-wrap justify-between gap-3 text-sm">
        <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onBack}>Tạo tài khoản mới</Button>
        <Link to={ROUTES.LOGIN} state={location.state} className="self-center underline underline-offset-4">Về đăng nhập</Link>
      </div>
    </div>
  );
}
