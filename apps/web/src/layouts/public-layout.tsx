import { Outlet, useLocation } from "react-router-dom";
import { PublicHeader } from "./components/public-header";
import { PublicFooter } from "./components/public-footer";
import { ROUTES } from "@/router/route-constants";
import { cn } from "@/lib/utils";
import "./public-layout.css";

export function PublicLayout() {
  const isHome = useLocation().pathname === ROUTES.HOME;

  return (
    <div className={cn(
      "public-layout flex min-h-screen flex-col bg-background text-foreground relative selection:bg-primary/30",
      isHome && "home-public-layout"
    )}>
      <a className="shell-skip-link" href="#public-main">Đến nội dung chính</a>
      {/* Top Navigation Bar */}
      <PublicHeader cinematic={isHome} />

      {/* Main Content Area */}
      <main id="public-main" tabIndex={-1} className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <PublicFooter />

    </div>
  );
}
