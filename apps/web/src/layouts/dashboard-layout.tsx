import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  User as UserIcon,
  BookOpen,
  History as HistoryIcon,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function DashboardLayout() {
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();

  const navItems = [
    { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: "Luyện tập", href: ROUTES.PRACTICE, icon: BookOpen },
    { label: "Lịch sử thi", href: ROUTES.HISTORY, icon: HistoryIcon },
    { label: "Hồ sơ cá nhân", href: ROUTES.PROFILE, icon: UserIcon },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Fixed Sticky Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Link
            to={ROUTES.HOME}
            title="Về trang chủ Olympic Platform"
            className="group flex items-center gap-3 transition-colors cursor-pointer"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="size-5" />
            </div>
            <span className="font-bold tracking-tight text-sidebar-foreground group-hover:text-primary transition-colors">
              Olympic Platform
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="border-t border-sidebar-border p-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link
              to={ROUTES.HOME}
              title="Về trang chủ Olympic Platform"
              className="group flex items-center gap-2 lg:hidden"
            >
              <GraduationCap className="size-6 text-primary group-hover:scale-105 transition-transform duration-200" />
              <span className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                Olympic Platform
              </span>
            </Link>
          </div>

          {/* User Header Profile Quick Link */}
          {user && (
            <Link
              to={ROUTES.PROFILE}
              className="flex items-center gap-3 rounded-full border border-border/60 bg-muted/30 py-1.5 pl-2 pr-4 transition-colors hover:bg-muted/80"
            >
              <div className="relative size-8 overflow-hidden rounded-full border border-border bg-muted">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName || user.username}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-primary/10 text-xs font-bold text-primary">
                    {(user.fullName || user.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold leading-none text-foreground">
                  {user.fullName || user.username}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  @{user.username}
                </p>
              </div>
            </Link>
          )}
        </header>

        {/* Page Body */}
        <div className="flex-1 p-6 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Alias for backward compatibility
export { DashboardLayout as ProtectedLayout };
