import { useNavigate } from "react-router-dom";
import { UserIcon, LogOut, Globe, MoreVertical, Sun, Moon } from "lucide-react";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useThemeStore } from "@/stores/use-theme-store";
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
  showChevron?: boolean;
}

export function UserDropdown({ direction = "up", className = "", showChevron = true }: UserDropdownProps) {
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex w-full items-center justify-between gap-3 rounded-xl p-2 hover:bg-muted/50 transition-colors cursor-pointer group ${className}`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="size-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || user.username}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-primary/10 text-sm font-bold text-primary">
                  {(user.fullName || user.username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-left overflow-hidden">
              <p className="truncate text-sm font-semibold leading-none text-foreground">
                {user.fullName || user.username}
              </p>
              <p className="truncate text-xs text-muted-foreground mt-1">
                @{user.username}
              </p>
            </div>
          </div>
          {showChevron && (
            <MoreVertical className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        side={direction === "up" ? "top" : "bottom"} 
        align="start" 
        className="w-64 rounded-2xl p-2"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Tài khoản
        </DropdownMenuLabel>
        
        <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)} className="rounded-xl px-3 py-2 cursor-pointer gap-2.5">
          <UserIcon className="size-4 text-primary" />
          <span>Hồ sơ cá nhân</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            setTheme(theme === "dark" ? "light" : "dark");
          }} 
          className="rounded-xl px-3 py-2 cursor-pointer justify-between"
        >
          <div className="flex items-center gap-2.5">
            {theme === "dark" ? <Moon className="size-4 text-primary" /> : <Sun className="size-4 text-primary" />}
            <span>Giao diện</span>
          </div>
          <span className="text-xs text-muted-foreground">{theme === "dark" ? "Tối" : "Sáng"}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate(ROUTES.HOME)} className="rounded-xl px-3 py-2 cursor-pointer gap-2.5">
          <Globe className="size-4 text-primary" />
          <span>Trang chủ</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        <DropdownMenuItem onClick={() => logout()} className="rounded-xl px-3 py-2 cursor-pointer gap-2.5 text-destructive focus:text-destructive focus:bg-destructive/10">
          <LogOut className="size-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
