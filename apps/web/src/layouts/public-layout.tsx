import { Outlet, useLocation } from "react-router-dom";
import { AiChatbotWidget } from "@/features/ai/components/ai-chatbot-widget";
import { PublicHeader } from "./components/public-header";
import { PublicFooter } from "./components/public-footer";
import { ROUTES } from "@/router/route-constants";
import { cn } from "@/lib/utils";
import "./public-layout.css";

export function PublicLayout() {
  const isHome = useLocation().pathname === ROUTES.HOME;

  return (
    <div className={cn(
      "flex min-h-screen flex-col bg-background text-foreground relative selection:bg-primary/30",
      isHome && "home-public-layout"
    )}>
      {/* Top Navigation Bar */}
      <PublicHeader cinematic={isHome} />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <PublicFooter />

      <AiChatbotWidget />
    </div>
  );
}
