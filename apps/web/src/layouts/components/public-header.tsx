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
  Bell,
  ChevronDown,
} from "lucide-react";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SeasonToggle } from "@/components/ui/season-toggle";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/stores/use-ui-store";
import { Bot } from "lucide-react";

export function PublicHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  const isScrolled = useScrolled(20);
  const { showAiWidget, toggleAiWidget } = useUiStore();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicNavItems = [
    { label: "Trang chủ", href: ROUTES.HOME },
    { label: "Môn học", href: ROUTES.SUBJECTS },
    { label: "Tài liệu", href: ROUTES.DOCUMENTS },
    { label: "Tin tức", href: ROUTES.NEWS },
    { label: "Kỳ thi", href: ROUTES.COMPETITIONS },
    { label: "Tiện ích", href: ROUTES.TOOLKIT },
    { label: "Giới thiệu", href: ROUTES.ABOUT },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        isScrolled
          ? "border-b border-border bg-background/80 backdrop-blur-md shadow-sm"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Logo />

        {/* Desktop Navigation Links */}
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {publicNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={isActive ? "page" : undefined}
                className="rounded-lg px-3.5 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground aria-[current=page]:font-semibold"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth / User Action Area */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Season Toggle */}
          <SeasonToggle />
          {/* Theme Toggle */}
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              {/* User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border/80 bg-card p-1 pr-2 shadow-xs hover:bg-accent transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
                  <DropdownMenuItem onClick={() => navigate(ROUTES.DASHBOARD)} className="rounded-xl px-2 py-2 cursor-pointer gap-2.5">
                    <LayoutDashboard className="size-4 text-primary" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)} className="rounded-xl px-2 py-2 cursor-pointer gap-2.5">
                    <UserIcon className="size-4 text-primary" />
                    <span>Hồ sơ cá nhân</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); toggleAiWidget(); }} className="rounded-xl px-2 py-2 cursor-pointer justify-between">
                    <div className="flex items-center gap-2.5">
                      <Bot className="size-4 text-primary" />
                      <span>Trợ lý AI</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{showAiWidget ? "Bật" : "Tắt"}</span>
                  </DropdownMenuItem>
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
              <Button asChild size="sm">
                <Link to={ROUTES.REGISTER}>Đăng ký</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Actions & Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:hidden">
          <SeasonToggle />
          <ThemeToggle />
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle menu"
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
                          to={ROUTES.DASHBOARD}
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
                        <button
                          type="button"
                          onClick={() => toggleAiWidget()}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                        >
                          <div className="flex items-center gap-2.5">
                            <Bot className="size-4 text-primary" />
                            Trợ lý AI
                          </div>
                          <span className="text-xs text-muted-foreground">{showAiWidget ? "Bật" : "Tắt"}</span>
                        </button>
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
