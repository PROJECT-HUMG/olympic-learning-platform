import { Outlet, Link, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/use-scrolled";
import { SeasonalBackground } from "@/components/ui/seasonal-background";
import { SeasonToggle } from "@/components/ui/season-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard,
  User as UserIcon,
  BookOpen,
  History as HistoryIcon,
  FileText,
  FolderTree,
} from "lucide-react";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { UserDropdown } from "@/features/auth/components/user-dropdown";
import { AiChatbotWidget } from "@/features/ai/components/ai-chatbot-widget";

export function DashboardLayout() {
  const location = useLocation();
  const isScrolled = useScrolled(20);
  const { data: user } = useCurrentUser();

  const navItems = useMemo(() => {
    const items = [];

    if (user?.role === "ADMIN") {
      items.push({ label: "Dashboard", href: ROUTES.ADMIN, icon: LayoutDashboard });
      items.push({ label: "Quản lý tài liệu", href: "/admin/documents", icon: FileText });
      items.push({ label: "Danh mục hệ thống", href: "/admin/categories", icon: FolderTree });
    } else if (user?.role === "LECTURER") {
      items.push({ label: "Dashboard", href: ROUTES.LECTURER, icon: LayoutDashboard });
      items.push({ label: "Quản lý tài liệu", href: "/lecturer/documents", icon: FileText });
    } else {
      items.push({ label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard });
    }

    // Shared items for all roles
    items.push({ label: "Luyện tập", href: ROUTES.PRACTICE, icon: BookOpen });
    items.push({ label: "Lịch sử thi", href: ROUTES.HISTORY, icon: HistoryIcon });
    items.push({ label: "Hồ sơ cá nhân", href: ROUTES.PROFILE, icon: UserIcon });

    return items;
  }, [user?.role]);

  return (
    <div className="flex min-h-screen bg-background/50 text-foreground relative selection:bg-primary/30">
      <SeasonalBackground />
      
      {/* Fixed Sticky Sidebar (Desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Logo />
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

        {/* User Profile Footer (Desktop) */}
        <div className="border-t border-sidebar-border p-3">
          <UserDropdown direction="up" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* Topbar Header */}
        <header
          className={cn(
            "sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6 transition-all duration-300",
            isScrolled
              ? "border-b border-border bg-background/80 backdrop-blur-md shadow-sm"
              : "border-transparent bg-transparent"
          )}
        >
          <div className="flex items-center gap-4">
            {/* Logo on mobile removed the restricted size to match public layout */}
            <Logo className="lg:hidden" />
          </div>

          <div className="flex items-center gap-2">
            <SeasonToggle />
            <ThemeToggle />
            {/* User Profile Dropdown (Mobile Only) */}
            <div className="lg:hidden ml-1">
              <UserDropdown direction="down" showChevron={false} />
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (Visible only on < lg screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full py-3 px-1 text-[10px] sm:text-xs font-medium transition-colors relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full" />
              )}
              <Icon 
                className={cn(
                  "mb-1.5 size-5 sm:size-6 transition-transform", 
                  isActive ? "scale-110 drop-shadow-sm" : ""
                )} 
              />
              <span className="truncate w-full text-center">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <AiChatbotWidget />
    </div>
  );
}
