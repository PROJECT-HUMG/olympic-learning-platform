import { Outlet, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SeasonalBackground } from "@/components/ui/seasonal-background";

export function AuthCardLayout() {
  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background/50 p-4 sm:p-6 lg:p-8">
      <SeasonalBackground />

      {/* Ambient Soft Center Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[450px] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/15"
        aria-hidden="true"
      />

      {/* Top Floating Controls */}
      <div className="absolute top-6 left-6 z-50">
        <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Về trang chủ
        </Link>
      </div>

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-xl backdrop-blur-md sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
