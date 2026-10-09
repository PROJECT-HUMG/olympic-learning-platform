import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SheetTrigger } from "@/components/ui/sheet";
import "./mobile-navbar.css";

/** Public-derived mobile row; caller owns account content and the enclosing Sheet. */
export function MobileNavbar({ account }: { account: ReactNode }) {
  return <div className="mobile-navbar">
    <Logo className="shell-brand__logo" />
    <div className="mobile-navbar__actions">
      <ThemeToggle className="shell-icon-control" />
      {account}
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Mở menu điều hướng" className="shell-menu-trigger">
          <Menu aria-hidden="true" /><span className="shell-menu-trigger__label">Menu</span>
        </Button>
      </SheetTrigger>
    </div>
  </div>;
}
