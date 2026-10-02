import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, type CSSProperties } from "react";
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
import { cn } from "@/lib/utils";
import { ROUTES, getDashboardRoute } from "@/router/route-constants";
import {
  getActiveNavigationItem,
  getNavigationGroups,
  PUBLIC_PRIMARY_NAVIGATION,
} from "../navigation";
import { NavigationGroups } from "./navigation-groups";
import "../navigation.css";
import "./public-header.css";

// The logo is the desktop home link; keep the grouped mobile menu unchanged.
const desktopNavigation = PUBLIC_PRIMARY_NAVIGATION.filter(
  (item) => item.href !== ROUTES.HOME,
);

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
  const activeIndex = desktopNavigation.findIndex(
    (item) => item.href === active?.href,
  );
  return (
    <header
      data-scrolled={isScrolled}
      className={cn(
        "public-header top-0 z-40 transition-colors duration-300 motion-reduce:transition-none",
        cinematic
          ? cn("fixed inset-x-0", !isScrolled && !isDesktop && "cinematic-theme")
          : "sticky",
        isScrolled
          ? "border-b border-border bg-background/90 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div
        className={cn(
          "public-header__inner mx-auto flex max-w-7xl items-center justify-between gap-3 transition-[height] duration-300 motion-reduce:transition-none",
          cinematic
            ? cn("px-5 sm:px-8", isScrolled ? "h-14" : "h-16")
            : "h-14 px-4 sm:px-6 lg:px-8",
        )}
      >
        <Logo
          className="public-header__logo shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          imageClassName="h-12"
        />
        <nav
          aria-label="Điều hướng chính"
          className="public-header__nav hidden items-center gap-1 xl:flex"
          style={{ "--active-index": Math.max(0, activeIndex) } as CSSProperties}
        >
          {desktopNavigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              aria-current={active?.href === item.href ? "page" : undefined}
              className="public-header__link rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {item.label}
            </Link>
          ))}
          <span
            aria-hidden="true"
            className="public-header__indicator"
            data-visible={activeIndex >= 0}
          />
        </nav>
        <div className="public-header__actions flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {cinematic && <HomeMotionToggle />}
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
              {user && user.role !== "STUDENT"
                ? "Không gian quản lý"
                : "Vào góc học tập"}
            </Link>
          </Button>
          {user && <UserDropdown direction="down" compact />}
          <Sheet open={menuOpen && !isDesktop} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mở menu điều hướng"
                className={cn(
                  "size-11 xl:hidden",
                  cinematic && "liquid-glass rounded-full",
                )}
              >
                <Menu aria-hidden="true" size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(90vw,24rem)] gap-0 p-0"
            >
              <SheetHeader className="border-b border-border p-5 pr-14">
                <SheetTitle>Khám phá Olympic HUMG</SheetTitle>
                <SheetDescription>
                  Học tập, thông tin và các tiện ích của bạn.
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <NavigationGroups
                  groups={getNavigationGroups(user?.role)}
                  onNavigate={() => setMenuOpen(false)}
                />
              </div>
              {!user && (
                <div className="grid grid-cols-2 gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
