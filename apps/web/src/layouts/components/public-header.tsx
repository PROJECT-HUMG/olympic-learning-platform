import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HomeMotionToggle } from "@/features/home/components/home-motion-toggle";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserDropdown } from "@/features/auth/components/user-dropdown";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useScrolled } from "@/hooks/use-scrolled";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ROUTES, getDashboardRoute } from "@/router/route-constants";
import {
  getActiveNavigationItem,
  getNavigationGroups,
  PUBLIC_PRIMARY_NAVIGATION,
} from "../navigation";
import { NavigationGroups } from "./navigation-groups";
import { PublicDisplaySettings } from "./public-display-settings";
import "../navigation.css";
import "./public-header.css";

export function PublicHeader({ cinematic = false }: { cinematic?: boolean }) {
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const isScrolled = useScrolled(20);
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const [menuOpen, setMenuOpen] = useState(false);
  const routeKey = location.pathname + location.search + location.hash;
  useEffect(() => setMenuOpen(false), [location.key, isDesktop]);
  const active = getActiveNavigationItem(
    PUBLIC_PRIMARY_NAVIGATION,
    location.pathname,
    location.search,
  );
  const loginState =
    location.pathname === ROUTES.HOME ? undefined : { from: routeKey };
  return (
    <header
      data-scrolled={isScrolled}
      data-home={cinematic}
      className="public-header"
    >
      <div className="public-header__inner">
        <Logo
          className="public-header__logo shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          imageClassName="h-12"
        />
        <nav
          aria-label="Điều hướng chính"
          className="public-header__nav"
        >
          {PUBLIC_PRIMARY_NAVIGATION.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              aria-current={active?.href === item.href ? "page" : undefined}
              className="public-header__link"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="public-header__actions flex shrink-0 items-center gap-1.5 sm:gap-2">
          {isDesktop ? <>
            <ThemeToggle />
            {cinematic && <HomeMotionToggle />}
          </> : null}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="public-header__cta hidden xl:inline-flex"
          >
            <Link
              to={user ? getDashboardRoute(user.role) : ROUTES.LOGIN}
              state={user ? undefined : loginState}
            >
              {user ? user.role === "STUDENT" ? "Góc học tập" : "Quản lý" : "Đăng nhập"}
            </Link>
          </Button>
          {user && <UserDropdown direction="down" compact className="size-11 rounded-full p-0" avatarClassName="size-11" />}
          <Sheet open={menuOpen && !isDesktop} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mở menu điều hướng"
                className="public-header__menu-trigger xl:hidden"
              >
                <Menu aria-hidden="true" size={18} />
                <span>Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="public-menu-sheet gap-0 p-0"
            >
              <SheetHeader className="shrink-0 border-b border-border p-5 pr-14">
                <SheetTitle>Khám phá Olympic HUMG</SheetTitle>
                <SheetDescription>
                  Học tập, thông tin và các tiện ích của bạn.
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <PublicDisplaySettings home={cinematic} />
                <NavigationGroups
                  groups={getNavigationGroups(user?.role)}
                  onNavigate={() => setMenuOpen(false)}
                />
              </div>
              {!user && (
                <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <Button asChild variant="outline" className="min-h-11">
                    <Link
                      to={ROUTES.LOGIN}
                      state={loginState}
                      onClick={() => setMenuOpen(false)}
                    >
                      Đăng nhập
                    </Link>
                  </Button>
                  <Button asChild className="min-h-11">
                    <Link
                      to={ROUTES.REGISTER}
                      state={loginState}
                      onClick={() => setMenuOpen(false)}
                    >
                      Tạo tài khoản
                    </Link>
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
