import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  GraduationCap,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function PublicLayout() {
  const location = useLocation();
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicNavItems = [
    { label: "Trang chủ", href: ROUTES.HOME },
    { label: "Môn học", href: ROUTES.SUBJECTS },
    { label: "Tài liệu", href: ROUTES.DOCUMENTS },
    { label: "Tin tức", href: ROUTES.NEWS },
    { label: "Kỳ thi", href: ROUTES.COMPETITIONS },
    { label: "Giới thiệu", href: ROUTES.ABOUT },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Olympic Platform
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {publicNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Auth Actions / Profile Menu */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <div className="flex items-center gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link to={ROUTES.DASHBOARD}>
                    <LayoutDashboard className="mr-2 size-4" />
                    Dashboard
                  </Link>
                </Button>

                <Link
                  to={ROUTES.PROFILE}
                  className="flex items-center gap-2.5 rounded-full border border-border/80 bg-card p-1 pr-3 shadow-xs hover:bg-accent transition-colors"
                >
                  <div className="size-7 overflow-hidden rounded-full border border-border bg-muted">
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
                  <span className="text-xs font-medium text-foreground">
                    {user.fullName || user.username}
                  </span>
                </Link>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={logout}
                  title="Đăng xuất"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="size-4" />
                </Button>
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

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="border-b border-border bg-card p-4 space-y-3 md:hidden">
            <nav className="flex flex-col space-y-1">
              {publicNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-border pt-3">
              {user ? (
                <div className="space-y-2">
                  <Link
                    to={ROUTES.DASHBOARD}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <LayoutDashboard className="size-4" />
                    Vào Dashboard
                  </Link>
                  <Link
                    to={ROUTES.PROFILE}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <UserIcon className="size-4" />
                    Hồ sơ cá nhân
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
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
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="size-4 text-primary" />
              <span>&copy; {new Date().getFullYear()} Olympic Learning Platform. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link to={ROUTES.ABOUT} className="hover:text-foreground">
                Giới thiệu
              </Link>
              <Link to={ROUTES.COMPETITIONS} className="hover:text-foreground">
                Kỳ thi
              </Link>
              <Link to={ROUTES.NEWS} className="hover:text-foreground">
                Tin tức
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
