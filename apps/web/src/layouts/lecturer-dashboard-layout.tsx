import { Outlet, Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { ROUTES } from "@/router/route-constants";
import { UserDropdown } from "@/features/auth/components/user-dropdown";
import { AiChatbotWidget } from "@/features/ai/components/ai-chatbot-widget";

export function LecturerDashboardLayout() {
  const location = useLocation();
  const isScrolled = useScrolled(20);

  const navItems = [
    { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: "Luyện tập", href: ROUTES.PRACTICE, icon: BookOpen },
    { label: "Lịch sử thi", href: ROUTES.HISTORY, icon: HistoryIcon },
    { label: "Hồ sơ cá nhân", href: ROUTES.PROFILE, icon: UserIcon },
  ];

  return (
    <div className="flex min-h-screen bg-background/50 text-foreground relative selection:bg-primary/30">
      <SeasonalBackground />
      {/* Fixed Sticky Sidebar */}
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
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar Header */}
        <header
          className={cn(
            "sticky top-0 z-30 flex h-16 items-center justify-between px-6 transition-all duration-300",
            isScrolled
              ? "border-b border-border bg-background/80 backdrop-blur-md shadow-sm"
              : "border-transparent bg-transparent"
          )}
        >
          <div className="flex items-center gap-4">
            <Logo className="lg:hidden" />
          </div>

          <div className="flex items-center gap-2">
            <SeasonToggle />
            <ThemeToggle />
            {/* User Profile Dropdown (Mobile Only) */}
            <div className="lg:hidden">
              <UserDropdown direction="down" showChevron={false} />
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="flex-1 p-6 sm:p-8">
          <Outlet />
        </div>
      </main>

      <AiChatbotWidget />
    </div>
  );
}


