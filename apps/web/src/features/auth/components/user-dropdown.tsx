import { UserAvatar } from "@/features/user/components/user-avatar";
import ProfileDropdown from "@/components/kokonutui/profile-dropdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Globe, LayoutDashboard, MoreVertical, User } from "lucide-react";
import { ROUTES, getDashboardRoute } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSidebar } from "@/components/ui/sidebar";
import "@/features/user/components/public-profile.css";

interface UserDropdownProps {
  direction?: "up" | "down";
  className?: string;
  compact?: boolean;
  avatarClassName?: string;
}

export function UserDropdown({
  direction = "up",
  className = "",
  compact = false,
  avatarClassName,
}: UserDropdownProps) {
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  const sidebar = useSidebar();
  const collapsed = compact || (!!sidebar && !sidebar.open);
  if (!user) return null;
  const avatar = <UserAvatar user={user} className="user-avatar--preview" />;
  const roleLabel = { STUDENT: "Sinh viên", LECTURER: "Giảng viên", ADMIN: "Quản trị viên" }[user.role];
  return (
    <ProfileDropdown
      data={{ name: user.fullName || user.username, email: user.email, context: roleLabel }}
      avatar={avatar}
      side={direction === "up" ? "top" : "bottom"}
      items={[
        { href: getDashboardRoute(user.role), label: user.role === "STUDENT" ? "Góc học tập" : "Không gian quản lý", icon: <LayoutDashboard aria-hidden="true" /> },
        { href: ROUTES.PROFILE, label: "Hồ sơ & bảo mật", icon: <User aria-hidden="true" /> },
        { href: ROUTES.HOME, label: "Trang chủ", icon: <Globe aria-hidden="true" /> },
      ]}
      onSignOut={() => void logout().catch(() => toast.error("Đã thoát trên thiết bị này. Chưa thể đóng phiên trên máy chủ."))}
      trigger={
        <button
          type="button"
          aria-label="Mở menu tài khoản"
          title="Tài khoản và không gian làm việc"
          className={cn("flex min-h-11 min-w-11 items-center gap-3 rounded-xl p-1.5 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring", collapsed ? "justify-center" : "w-full justify-between", className)}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span data-slot="account-avatar" className={cn("flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted", avatarClassName)}>
              <UserAvatar user={user} className="size-full! rounded-none! border-0! bg-transparent!" />
            </span>
            {!collapsed && (
              <span className="min-w-0 text-left">
                <span className="block truncate text-sm font-medium">
                  {user.fullName || user.username}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  @{user.username}
                </span>
              </span>
            )}
          </span>
          {!collapsed && (
            <MoreVertical aria-hidden="true" size={16} className="shrink-0" />
          )}
        </button>
      }
    />
  );
}
