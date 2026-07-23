import { useUserProfile } from "@/features/user/hooks/use-user-profile";
import { AvatarUploadCard } from "@/features/user/components/avatar-upload-card";
import { ProfileForm } from "@/features/user/components/profile-form";
import { AccountSecurityCard } from "@/features/user/components/account-security-card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { data: user, isLoading, isError } = useUserProfile();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mb-3" />
        <h2 className="text-lg font-semibold text-foreground">Không thể tải thông tin hồ sơ</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vui lòng thử lại sau hoặc đăng nhập lại.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <User className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Hồ Sơ Cá Nhân
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông tin tài khoản, ảnh đại diện và bảo mật
          </p>
        </div>
      </div>

      {/* Profile Components */}
      <AvatarUploadCard user={user} />
      <ProfileForm user={user} />
      <AccountSecurityCard user={user} />
    </div>
  );
}
