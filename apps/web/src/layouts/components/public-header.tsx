import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/use-scrolled";
import { Logo } from "@/components/ui/logo";
import {
  Menu,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { ROUTES, getDashboardRoute } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/stores/use-ui-store";
import { Toggle } from "@/components/ui/toggle";
import { Bot } from "lucide-react";

export function PublicHeader({ cinematic = false }: { cinematic?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  const isScrolled = useScrolled(20);
  const { showAiWidget, toggleAiWidget, setShowAiWidget } = useUiStore();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicNavItems = [
    { label: "Trang chủ", href: ROUTES.HOME },
    { label: "Môn học", href: ROUTES.SUBJECTS },
    { label: "Tài liệu", href: ROUTES.DOCUMENTS },
    { label: "Bảng tin", href: ROUTES.NEWS },
    { label: "Kỳ thi", href: ROUTES.COMPETITIONS },
    { label: "Tiện ích", href: ROUTES.TOOLKIT },
    { label: "Giới thiệu", href: ROUTES.ABOUT },
  ];

  return (
    <header
      className={cn(
        "top-0 z-40 transition-colors duration-300 motion-reduce:transition-none",
        cinematic
          ? cn("fixed inset-x-0", !isScrolled && "cinematic-theme")
          : "sticky",
        isScrolled
          ? "border-b border-border bg-background/90 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className={cn(
        "mx-auto flex max-w-7xl items-center justify-between transition-[height] duration-300 motion-reduce:transition-none",
        cinematic ? cn("gap-4 px-5 sm:px-8", isScrolled ? "h-14" : "h-16") : "h-14 px-4 sm:px-6 lg:px-8"
      )}>
        {/* Brand Logo */}
        <Logo
          className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          imageClassName="h-12"
        />

        {/* Desktop Navigation Links */}
        <nav aria-label="Điều hướng chính" className={cn(
          "hidden items-center",
          cinematic ? "gap-5 xl:flex" : "gap-1 xl:flex"
        )}>
          {publicNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-lg py-2 text-sm transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                  cinematic
                    ? "font-normal aria-[current=page]:text-foreground"
                    : "px-3.5 font-medium hover:bg-muted aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground aria-[current=page]:font-semibold"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth / User Action Area */}
        <div className="hidden items-center gap-3 xl:flex">
          {/* Theme Toggle */}
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              {/* User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="Mở menu tài khoản" className={cn(
                    "flex items-center gap-2 rounded-full p-1 pr-2 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    cinematic ? "liquid-glass" : "border border-border/80 bg-card shadow-xs hover:bg-accent"
                  )}>
                    <div className="size-8 overflow-hidden rounded-full border border-border bg-muted">
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
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2" sideOffset={8}>
                  <div className="px-2 py-1.5 mb-1 border-b border-border/60">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate(getDashboardRoute(user.role))} className="rounded-xl px-2 py-2 cursor-pointer gap-2.5">
                    <LayoutDashboard className="size-4 text-primary" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)} className="rounded-xl px-2 py-2 cursor-pointer gap-2.5">
                    <UserIcon className="size-4 text-primary" />
                    <span>Hồ sơ cá nhân</span>
                  </DropdownMenuItem>
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleAiWidget();
                    }}
                    className="rounded-xl px-2 py-2 cursor-pointer flex items-center justify-between hover:bg-muted/50 transition-colors select-none group"
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
                  <DropdownMenuSeparator className="my-1 bg-border/60" />
                  <DropdownMenuItem onClick={() => logout()} className="rounded-xl px-2 py-2 cursor-pointer gap-2.5 text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="size-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to={ROUTES.LOGIN}>Đăng nhập</Link>
              </Button>
              <Button asChild size="sm" className={cinematic ? "h-8 rounded-full px-4 text-xs font-medium" : undefined}>
                <Link to={ROUTES.REGISTER}>{cinematic ? "Bắt đầu học" : "Đăng ký"}</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Actions & Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 xl:hidden">
          <ThemeToggle />
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mở menu điều hướng"
                className={cinematic ? "liquid-glass rounded-full" : undefined}
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 sm:w-[400px]">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border flex items-center h-16">
                  <Logo />
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <nav aria-label="Mobile Main" className="flex flex-col space-y-1">
                    {publicNavItems.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => setMobileMenuOpen(false)}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground aria-[current=page]:font-semibold"
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div role="separator" className="h-px bg-border my-4" />
                  <div>
                    {user ? (
                      <div className="space-y-1">
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Tài khoản: {user.fullName || user.username}
                        </div>
                        <Link
                          to={getDashboardRoute(user.role)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                        >
                          <LayoutDashboard className="size-4 text-primary" />
                          Dashboard
                        </Link>
                        <Link
                          to={ROUTES.PROFILE}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                        >
                          <UserIcon className="size-4 text-primary" />
                          Hồ sơ cá nhân
                        </Link>
                        <div
                          onClick={() => toggleAiWidget()}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <Bot className="size-4 text-primary" />
                            <div className="flex flex-col">
                              <span>Trợ lý AI</span>
                              <span className="text-[10px] text-muted-foreground">{showAiWidget ? "Đang bật" : "Đã tắt"}</span>
                            </div>
                          </div>
                          <div
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
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
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                        >
                          <LogOut className="size-4" />
                          Đăng xuất
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                            Đăng nhập
                          </Link>
                        </Button>
                        <Button asChild size="sm" className="w-full">
                          <Link to={ROUTES.REGISTER} onClick={() => setMobileMenuOpen(false)}>
                            Đăng ký
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
