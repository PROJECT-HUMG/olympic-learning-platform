import { useNavigate } from "react-router-dom";
import { UserIcon, LogOut, Globe, MoreVertical, Sun, Moon } from "lucide-react";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useThemeStore } from "@/stores/use-theme-store";

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
    <div className={`relative ${className}`}>
      <button
        type="button"
        popoverTarget="user-dropdown-menu"
        style={{ anchorName: "--user-dropdown" } as any}
        className="flex w-full items-center justify-between gap-3 rounded-xl p-2 hover:bg-muted/50 transition-colors cursor-pointer group"
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

      {/* Dropdown Menu (Native Popover) */}
      <div 
        id="user-dropdown-menu"
        popover="auto"
        role="menu"
        style={{ 
          positionAnchor: "--user-dropdown", 
          inset: "unset", 
          top: direction === "down" ? "anchor(bottom 8px)" : "unset",
          bottom: direction === "up" ? "anchor(top 8px)" : "unset",
          right: "anchor(right)",
          margin: 0
        } as any}
        className="w-64 rounded-2xl border border-border bg-card p-2 shadow-xl backdrop-blur-md open:animate-in open:fade-in-0 open:zoom-in-95 z-50"
      >
        {/* User Header Info (redundant if bottom, but good for context) */}
        <div className="px-3 py-2 border-b border-border/60 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tài khoản</span>
        </div>

        {/* Actions */}
        <div className="space-y-0.5">
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              ((e.target as HTMLElement).closest("[popover]") as any)?.hidePopover();
              navigate(ROUTES.PROFILE);
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <UserIcon className="size-4 text-primary" />
            <span>Hồ sơ cá nhân</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {theme === "dark" ? <Moon className="size-4 text-primary" /> : <Sun className="size-4 text-primary" />}
              <span>Giao diện</span>
            </div>
            <span className="text-xs text-muted-foreground">{theme === "dark" ? "Tối" : "Sáng"}</span>
          </button>
          
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              ((e.target as HTMLElement).closest("[popover]") as any)?.hidePopover();
              navigate(ROUTES.HOME);
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <Globe className="size-4 text-primary" />
            <span>Trang chủ</span>
          </button>
        </div>

        <div role="separator" className="h-px bg-border/60 my-1" />
        <div className="pt-1">
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              ((e.target as HTMLElement).closest("[popover]") as any)?.hidePopover();
              logout();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
}
