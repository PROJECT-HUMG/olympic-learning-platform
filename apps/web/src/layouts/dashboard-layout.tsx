import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Compass, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { UserDropdown } from "@/features/auth/components/user-dropdown";
import { NavigationGroups } from "./components/navigation-groups";
import { NavigationDrawer } from "./components/navigation-drawer";
import { getActiveNavigationItem, getDrawerNavigationGroups, getNavigationGroups, getWorkspaceNavigationGroups, getWorkspaceShortcuts } from "./navigation";
import { ROUTES } from "@/router/route-constants";
import "./navigation.css";

export function DashboardLayout() {
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuReturnFocus = useRef<HTMLElement | null>(null);
  const toggleReturnFocus = useRef(false);
  const isDesktop = useMediaQuery("(min-width: 1200px)");
  const hasRail = useMediaQuery("(min-width: 768px)");
  const expanded = isDesktop && sidebarOpen;
  const groups = getNavigationGroups(user?.role);
  const active = getActiveNavigationItem(groups.flatMap(group => group.items), location.pathname, location.search);
  const dailyArea = location.pathname === ROUTES.DAILY || location.pathname.startsWith(`${ROUTES.DAILY}/`);
  const shortcuts = getWorkspaceShortcuts(user?.role);
  const roleLabel = user?.role === "ADMIN" ? "Quản trị viên" : user?.role === "LECTURER" ? "Giảng viên" : "Sinh viên";
  useEffect(() => setMenuOpen(false), [location.key, isDesktop, hasRail]);
  useEffect(() => {
    if (!toggleReturnFocus.current) return;
    toggleReturnFocus.current = false;
    document.querySelector<HTMLButtonElement>(expanded ? '[aria-label="Thu gọn menu"]' : '[aria-label="Mở rộng menu"]')?.focus();
  }, [expanded]);
  function changeMenuOpen(open: boolean) {
    if (open) menuReturnFocus.current = document.activeElement as HTMLElement;
    setMenuOpen(open);
  }
  function toggleSidebar() {
    toggleReturnFocus.current = true;
    setSidebarOpen(open => !open);
  }

  return <Sheet open={menuOpen} onOpenChange={changeMenuOpen}>
    <div className="workspace-layout" data-expanded={expanded}>
      <a className="shell-skip-link" href="#workspace-content">Đến nội dung chính</a>
      {hasRail && <aside className="workspace-sidebar" aria-label="Điều hướng không gian cá nhân" data-expanded={expanded}>
        <div className="workspace-sidebar__brand shell-brand">
          <Logo className="shell-brand__logo" />
          {expanded && <span className="shell-brand__name" aria-hidden="true">Olympic<span>HUMG</span></span>}
        </div>
        {expanded ? <>
          <div className="workspace-sidebar__context"><span>{roleLabel}</span><Button variant="ghost" size="icon" aria-label="Thu gọn menu" aria-expanded="true" onClick={toggleSidebar}><PanelLeftClose aria-hidden="true" /></Button></div>
          <div className="workspace-sidebar__body"><NavigationGroups groups={getWorkspaceNavigationGroups(user?.role)} /></div>
        </> : <>
          <div className="workspace-rail__controls">
            {isDesktop && <Button variant="ghost" size="icon" aria-label="Mở rộng menu" aria-expanded="false" onClick={toggleSidebar}><PanelLeftOpen aria-hidden="true" /></Button>}
            <SheetTrigger asChild><Button variant="ghost" className="workspace-rail__link" aria-label="Mở menu điều hướng"><Menu aria-hidden="true" size={20} /><span>Menu</span></Button></SheetTrigger>
          </div>
          <nav className="workspace-rail" aria-label="Lối tắt không gian cá nhân">
            {shortcuts.map(item => <Link key={item.href} to={item.href} className="workspace-rail__link" aria-label={item.label} title={item.label} aria-current={active?.href === item.href ? "page" : undefined}>
              <item.icon aria-hidden="true" size={20} /><span>{item.shortLabel}</span>
            </Link>)}
          </nav>
        </>}
        {expanded && <div className="workspace-sidebar__footer">
          <SheetTrigger asChild><Button variant="ghost" className="workspace-discovery" aria-label="Mở menu điều hướng">
            <Compass aria-hidden="true" size={20} /><span>Khám phá</span>
          </Button></SheetTrigger>
        </div>}
      </aside>}
      <main className="workspace-main" id="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-topbar__identity">
            {!hasRail && <SheetTrigger asChild><Button variant="ghost" className="shell-menu-trigger" aria-label="Mở menu điều hướng"><Menu aria-hidden="true" /><span className="shell-menu-trigger__label">Menu</span></Button></SheetTrigger>}
            {!hasRail && <Logo className="shell-brand__logo" />}
            <div className="workspace-topbar__context"><span>{roleLabel}</span><p>{dailyArea ? "Góc học tập" : active?.label ?? "Không gian cá nhân"}</p></div>
          </div>
          <div className="workspace-topbar__actions"><ThemeToggle /><UserDropdown direction="down" compact className="shell-account" avatarClassName="size-9" /></div>
        </header>
        <div className="workspace-content" id="workspace-content" tabIndex={-1}><Outlet /></div>
      </main>
    </div>
    <NavigationDrawer workspace groups={getDrawerNavigationGroups(user?.role)} onNavigate={() => setMenuOpen(false)} onCloseAutoFocus={event => {
      // Several triggers share this drawer; return to the one actually used, not
      // Radix's last registered trigger. On breakpoint unmount use the new entry.
      event.preventDefault();
      const target = menuReturnFocus.current;
      if (target?.isConnected && target.getBoundingClientRect().width > 0) target.focus();
      else document.querySelector<HTMLButtonElement>('[aria-label="Mở menu điều hướng"]')?.focus();
    }} />
  </Sheet>;
}
