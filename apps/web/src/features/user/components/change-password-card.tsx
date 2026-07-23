import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useChangePassword } from "@/features/auth/hooks/use-change-password";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z
      .string()
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
      .max(100, "Mật khẩu không được vượt quá 100 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Mật khẩu mới không được trùng với mật khẩu hiện tại",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không trùng khớp",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordCard() {
  const changePasswordMutation = useChangePassword();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  function onSubmit(data: ChangePasswordFormValues) {
    changePasswordMutation.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          reset();
        },
      }
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8 space-y-6">
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <KeyRound className="size-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Đổi Mật Khẩu
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Cập nhật mật khẩu định kỳ để tăng cường bảo mật cho tài khoản của bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        {/* Current Password */}
        <div className="relative">
          <FormField
            id="change-current-password"
            type={showCurrent ? "text" : "password"}
            label="Mật khẩu hiện tại"
            required
            placeholder="••••••••"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-8.5 text-muted-foreground hover:text-foreground transition-colors"
            title={showCurrent ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {/* New Password */}
        <div className="relative">
          <FormField
            id="change-new-password"
            type={showNew ? "text" : "password"}
            label="Mật khẩu mới"
            required
            placeholder="••••••••"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-8.5 text-muted-foreground hover:text-foreground transition-colors"
            title={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <FormField
            id="change-confirm-password"
            type={showConfirm ? "text" : "password"}
            label="Xác nhận mật khẩu mới"
            required
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-8.5 text-muted-foreground hover:text-foreground transition-colors"
            title={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            loading={changePasswordMutation.isPending}
            disabled={changePasswordMutation.isPending}
          >
            <Lock className="mr-2 size-4" />
            Đổi mật khẩu
          </Button>
        </div>
      </form>
    </div>
  );
}
