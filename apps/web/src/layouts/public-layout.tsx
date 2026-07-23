import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Menu,
  X,
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

export function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAvatarDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
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

          {/* Desktop Auth / User Action Area */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Placeholder Notification Button */}
                <button
                  type="button"
                  className="relative flex size-9 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                  title="Thông báo"
                >
                  <Bell className="size-4" />
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
                  <span className="sr-only">Thông báo mới</span>
                </button>

                {/* User Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                    className="flex items-center gap-2 rounded-full border border-border/80 bg-card p-1 pr-2 shadow-xs hover:bg-accent transition-colors cursor-pointer"
                    aria-expanded={avatarDropdownOpen}
                  >
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

                  {/* Dropdown Menu */}
                  {avatarDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 z-50">
                      {/* User Header */}
                      <div className="px-3 py-2 border-b border-border/60 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user.fullName || user.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>

                      {/* Dropdown Actions */}
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarDropdownOpen(false);
                            navigate(ROUTES.DASHBOARD);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                          <LayoutDashboard className="size-4 text-primary" />
                          <span>Dashboard</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAvatarDropdownOpen(false);
                            navigate(ROUTES.PROFILE);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
                        >
                          <UserIcon className="size-4 text-primary" />
                          <span>Hồ sơ cá nhân</span>
                        </button>
                      </div>

                      <div className="border-t border-border/60 mt-1 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarDropdownOpen(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <LogOut className="size-4" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-border bg-card p-4 space-y-3 md:hidden animate-in fade-in-0 slide-in-from-top-2">
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
