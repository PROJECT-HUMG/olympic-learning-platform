import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, User as UserIcon, Mail, Shield, Activity, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useUpdateProfile } from "../hooks/use-update-profile";
import type { UserProfile } from "../types/user.types";

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ và tên phải chứa ít nhất 2 ký tự")
    .max(100, "Họ và tên không vượt quá 100 ký tự"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: UserProfile;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const updateProfileMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName || "",
    },
  });

  function onSubmit(data: ProfileFormValues) {
    updateProfileMutation.mutate(data);
  }

  const roleLabelMap: Record<string, { label: string; color: string }> = {
    STUDENT: { label: "Sinh viên", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    LECTURER: { label: "Giảng viên", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    ADMIN: { label: "Quản trị viên", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  };

  const statusLabelMap: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: "Hoạt động", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    PENDING: { label: "Chờ xác thực", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    DISABLED: { label: "Đã khóa", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  };

  const roleInfo = roleLabelMap[user.role] || { label: user.role, color: "bg-muted text-muted-foreground" };
  const statusInfo = statusLabelMap[user.status] || { label: user.status, color: "bg-muted text-muted-foreground" };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8 space-y-6">
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Thông Tin Cá Nhân
        </h3>
        <p className="text-sm text-muted-foreground">
          Quản lý thông tin hiển thị và chi tiết tài khoản của bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Full Name field */}
        <div className="space-y-2">
          <FormField
            id="profile-fullname"
            type="text"
            label="Họ và tên"
            placeholder="Nhập họ và tên của bạn"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </div>

        {/* Readonly info grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Email */}
          <div className="space-y-1 rounded-xl border border-border/60 bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Mail className="size-3.5" />
              <span>Địa chỉ Email</span>
            </div>
            <p className="text-sm font-medium text-foreground">{user.email}</p>
          </div>

          {/* Username */}
          <div className="space-y-1 rounded-xl border border-border/60 bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <UserIcon className="size-3.5" />
              <span>Tên đăng nhập (Username)</span>
            </div>
            <p className="text-sm font-medium text-foreground">@{user.username}</p>
          </div>

          {/* Role */}
          <div className="space-y-1 rounded-xl border border-border/60 bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Shield className="size-3.5" />
              <span>Vai trò hệ thống</span>
            </div>
            <div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1 rounded-xl border border-border/60 bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Activity className="size-3.5" />
              <span>Trạng thái tài khoản</span>
            </div>
            <div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Last Login */}
        {user.lastLoginAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            <span>
              Đăng nhập gần nhất:{" "}
              <strong className="font-medium text-foreground">
                {new Date(user.lastLoginAt).toLocaleString("vi-VN")}
              </strong>
            </span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={!isDirty || updateProfileMutation.isPending}
            loading={updateProfileMutation.isPending}
          >
            <Save className="mr-2 size-4" />
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
