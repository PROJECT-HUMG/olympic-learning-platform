import { Outlet, Link } from "react-router-dom";
import { SeasonalBackground } from "@/components/ui/seasonal-background";
import { ROUTES } from "@/router/route-constants";
import { AiChatbotWidget } from "@/features/ai/components/ai-chatbot-widget";
import { PublicHeader } from "./components/public-header";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background/50 text-foreground relative selection:bg-primary/30">
      <SeasonalBackground />


      {/* Ambient Soft Center Glow */}
      <div
        className="fixed left-1/2 top-1/2 -z-10 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px] pointer-events-none dark:bg-primary/10"
        aria-hidden="true"
      />

      {/* Top Navigation Bar */}
      <PublicHeader />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-card/60 py-8 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <img src="/icons.svg" alt="Logo" className="size-5 object-contain grayscale opacity-60" />
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

      <AiChatbotWidget />
    </div>
  );
}
