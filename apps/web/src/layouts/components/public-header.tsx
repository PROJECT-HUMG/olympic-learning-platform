import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { UserDropdown } from "@/features/auth/components/user-dropdown";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ROUTES, getDashboardRoute } from "@/router/route-constants";
import { getActiveNavigationItem, getDrawerNavigationGroups, PUBLIC_PRIMARY_NAVIGATION } from "../navigation";
import { NavigationDrawer } from "./navigation-drawer";
import { MobileNavbar } from "./mobile-navbar";
import "../navigation.css";
import "./public-header.css";

export function PublicHeader({ cinematic = false }: { cinematic?: boolean }) {
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const isDesktop = useMediaQuery("(min-width: 1200px)");
  const isTablet = useMediaQuery("(min-width: 768px)");
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [location.key, isDesktop, isTablet]);
  const active = getActiveNavigationItem(PUBLIC_PRIMARY_NAVIGATION, location.pathname, location.search);
  const loginState = location.pathname === ROUTES.HOME ? undefined : { from: location.pathname + location.search + location.hash };
  const primary = isDesktop ? PUBLIC_PRIMARY_NAVIGATION : PUBLIC_PRIMARY_NAVIGATION.filter(item => ([ROUTES.SUBJECTS, ROUTES.DOCUMENTS, ROUTES.NEWS] as string[]).includes(item.href));

  const account = user && <UserDropdown direction="down" compact className="shell-account" avatarClassName="size-9" />;
  const entry = <Button asChild className="public-header__cta" variant={user ? "outline" : "default"}>
    <Link to={user ? getDashboardRoute(user.role) : ROUTES.LOGIN} state={user ? undefined : loginState}>
      {user ? user.role === "STUDENT" ? "Góc học tập" : "Quản lý" : "Đăng nhập"}
    </Link>
  </Button>;

  return <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
    <header data-home={cinematic} className="public-header">
      {!isTablet ? <MobileNavbar account={account || entry} /> : <div className="public-header__inner">
        <div className="shell-brand">
          <Logo className="shell-brand__logo" />
          <span className="shell-brand__name" aria-hidden="true">Olympic<span>HUMG</span></span>
        </div>
        <nav aria-label="Điều hướng chính" className="public-header__nav">
          {primary.map(item => <Link key={item.href} to={item.href}
            aria-current={active?.href === item.href ? "page" : undefined} className="public-header__link">{item.label}</Link>)}
        </nav>
        <div className="public-header__actions">
          <ThemeToggle className="shell-icon-control" />
          {entry}
          {account}
          <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Mở menu điều hướng" className="shell-menu-trigger">
            <Menu aria-hidden="true" /><span className="shell-menu-trigger__label">Menu</span>
          </Button></SheetTrigger>
        </div>
      </div>}
    </header>
    <NavigationDrawer groups={getDrawerNavigationGroups(user?.role)} onNavigate={() => setMenuOpen(false)} footer={!user &&
      <div className="navigation-drawer__auth">
        <Button asChild variant="outline"><Link to={ROUTES.LOGIN} state={loginState} onClick={() => setMenuOpen(false)}>Đăng nhập</Link></Button>
        <Button asChild><Link to={ROUTES.REGISTER} state={loginState} onClick={() => setMenuOpen(false)}>Tạo tài khoản</Link></Button>
      </div>}
    />
  </Sheet>;
}
