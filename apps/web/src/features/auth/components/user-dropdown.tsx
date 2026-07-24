import { useState, useRef, useEffect } from "react";
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
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute ${direction === "up" ? "bottom-full mb-2" : "top-full mt-2"} right-0 w-64 rounded-2xl border border-border bg-card p-2 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 z-50`}
        >
          {/* User Header Info (redundant if bottom, but good for context) */}
          <div className="px-3 py-2 border-b border-border/60 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tài khoản</span>
          </div>

          {/* Actions */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(ROUTES.PROFILE);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <UserIcon className="size-4 text-primary" />
              <span>Hồ sơ cá nhân</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme(theme === "dark" ? "light" : "dark");
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="size-4 text-amber-500" />
              ) : (
                <Moon className="size-4 text-slate-500" />
              )}
              <span>Giao diện {theme === "dark" ? "Sáng" : "Tối"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(ROUTES.HOME);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <Globe className="size-4 text-emerald-500" />
              <span>Về trang chủ</span>
            </button>
          </div>

          <div className="border-t border-border/60 mt-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <LogOut className="size-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
