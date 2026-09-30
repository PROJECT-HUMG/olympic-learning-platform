import { useNavigate } from "react-router-dom";
import { LogOut, Globe, MoreVertical, Sun, Moon, Bot } from "lucide-react";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useThemeStore } from "@/stores/use-theme-store";
import { useUiStore } from "@/stores/use-ui-store";
import { Toggle } from "@/components/ui/toggle";
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
  showChevron?: boolean;
}

export function UserDropdown({ direction = "up", className = "", showChevron = true }: UserDropdownProps) {
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const { showAiWidget, toggleAiWidget, setShowAiWidget } = useUiStore();
  const sidebar = useSidebar();
  const isSidebarCollapsed = sidebar ? !sidebar.open : false;

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex w-full items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} gap-3 rounded-xl p-2 hover:bg-muted/50 transition-colors cursor-pointer group ${className}`}
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
            {!isSidebarCollapsed && (
              <div className="text-left overflow-hidden py-0.5 whitespace-nowrap">
                <p className="truncate text-sm font-semibold leading-tight text-foreground">
                  {user.fullName || user.username}
                </p>
                <p className="truncate text-xs text-muted-foreground mt-0.5">
                  @{user.username}
                </p>
              </div>
            )}
          </div>
          {showChevron && !isSidebarCollapsed && (
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

        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleAiWidget();
          }} 
          className="rounded-xl px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-muted/50 transition-colors select-none group"
        >
          <div className="flex items-center gap-2.5">
            <Bot className="size-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none text-foreground">Trợ lý AI</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{showAiWidget ? "Đang bật" : "Đã tắt"}</span>
            </div>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="shrink-0 flex items-center"
          >
            <Toggle
              checked={showAiWidget}
              onCheckedChange={setShowAiWidget}
              stretch={36}
              speed={50}
              scale={0.58}
              aria-label="Bật tắt Trợ lý AI"
            />
          </div>
        </div>

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
