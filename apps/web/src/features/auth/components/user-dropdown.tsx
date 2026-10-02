import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Globe,
  LayoutDashboard,
  LogOut,
  MoreVertical,
  User,
} from "lucide-react";
import { ROUTES, getDashboardRoute } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Mở menu tài khoản"
          className={cn("flex min-h-11 items-center gap-3 rounded-xl p-1.5 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring", collapsed ? "justify-center" : "w-full justify-between", className)}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className={cn("flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-sm font-semibold", avatarClassName)}>
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                (user.fullName || user.username).charAt(0).toUpperCase()
              )}
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
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={direction === "up" ? "top" : "bottom"}
        align="end"
        className="w-64 max-w-[calc(100vw-2rem)] rounded-xl p-2"
        sideOffset={8}
      >
        <DropdownMenuLabel className="min-w-0">
          <span className="block truncate">
            {user.fullName || user.username}
          </span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={getDashboardRoute(user.role)} className="min-h-11">
            <LayoutDashboard aria-hidden="true" />
            {user.role === "STUDENT" ? "Góc học tập" : "Không gian quản lý"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={ROUTES.PROFILE} className="min-h-11">
            <User aria-hidden="true" />
            Hồ sơ & bảo mật
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={ROUTES.HOME} className="min-h-11">
            <Globe aria-hidden="true" />
            Trang chủ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            void logout().catch(() =>
              toast.error(
                "Đã thoát trên thiết bị này. Chưa thể đóng phiên trên máy chủ.",
              ),
            )
          }
          className="min-h-11 text-destructive focus:text-destructive"
        >
          <LogOut aria-hidden="true" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
