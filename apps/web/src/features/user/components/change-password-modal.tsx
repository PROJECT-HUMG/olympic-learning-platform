import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const changePasswordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function onSubmit(data: ChangePasswordFormValues) {
    changePasswordMutation.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <KeyRound className="size-5" />
            <DialogTitle>Đổi Mật Khẩu</DialogTitle>
          </div>
          <DialogDescription>
            Nhập mật khẩu hiện tại và mật khẩu mới của bạn để hoàn tất thay đổi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <FormField
            id="modal-current-password"
            type="password"
            label="Mật khẩu hiện tại"
            required
            placeholder="••••••••"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />

          <FormField
            id="modal-new-password"
            type="password"
            label="Mật khẩu mới"
            required
            placeholder="••••••••"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />

          <FormField
            id="modal-confirm-password"
            type="password"
            label="Xác nhận mật khẩu mới"
            required
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={changePasswordMutation.isPending}
            >
              Hủy
            </Button>
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
      </DialogContent>
    </Dialog>
  );
}
