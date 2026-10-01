import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Sidebar, DesktopSidebar, SidebarLink } from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { UserDropdown } from "@/features/auth/components/user-dropdown";
import { NavigationGroups } from "./components/navigation-groups";
import { getActiveNavigationItem, getNavigationGroups } from "./navigation";
import "./navigation.css";

export function DashboardLayout() {
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const groups = getNavigationGroups(user?.role);
  const workspaceGroups = [...groups].sort((a, b) => {
    const order = [
      "Cá nhân",
      "Quản lý nội dung",
      "Quản trị hệ thống",
      "Học tập",
      "Thông tin",
    ];
    return order.indexOf(a.label) - order.indexOf(b.label);
  });
  const active = getActiveNavigationItem(
    groups.flatMap((group) => group.items),
    location.pathname,
    location.search,
  );
  useEffect(() => setMenuOpen(false), [location.key, isDesktop]);

  return (
    <div className="workspace-layout">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <DesktopSidebar width="252px" collapsedWidth="72px">
          <div className="workspace-sidebar__header">
            {sidebarOpen && <Logo imageClassName="h-10" />}
            <Button
              variant="ghost"
              size="icon"
              aria-label={sidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((open) => !open)}
            >
              {sidebarOpen ? (
                <PanelLeftClose aria-hidden="true" />
              ) : (
                <PanelLeftOpen aria-hidden="true" />
              )}
            </Button>
          </div>
          <nav
            className="workspace-sidebar__groups"
            aria-label="Menu không gian cá nhân"
          >
            {workspaceGroups.map((group) => (
              <section
                key={group.label}
                className="workspace-sidebar__group"
                data-collapsed={!sidebarOpen}
              >
                <h2>{group.label}</h2>
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    link={{
                      label: item.label,
                      href: item.href,
                      icon: <item.icon aria-hidden="true" size={18} />,
                    }}
                    isActive={active?.href === item.href}
                  />
                ))}
              </section>
            ))}
          </nav>
          <div className="border-t border-sidebar-border p-2">
            <UserDropdown direction="up" />
          </div>
        </DesktopSidebar>
      </Sidebar>
      <main className="workspace-main">
        <header className="workspace-topbar">
          <Logo className="lg:hidden" imageClassName="h-10" />
          <p className="workspace-topbar__title hidden lg:block">
            {active?.label ?? "Không gian cá nhân"}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <div className="lg:hidden">
              <UserDropdown direction="down" compact />
            </div>
            <Sheet open={menuOpen && !isDesktop} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 lg:hidden"
                  aria-label="Mở menu điều hướng"
                >
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[min(90vw,24rem)] gap-0 p-0"
              >
                <SheetHeader className="border-b border-border p-5 pr-14">
                  <SheetTitle>Không gian của bạn</SheetTitle>
                  <SheetDescription>
                    Chọn khu vực học tập hoặc quản lý.
                  </SheetDescription>
                </SheetHeader>
                <div className="workspace-menu__body">
                  <NavigationGroups
                    groups={workspaceGroups}
                    onNavigate={() => setMenuOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <div className="workspace-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
