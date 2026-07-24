import { Outlet } from "react-router-dom";
import { SeasonalBackground } from "@/components/ui/seasonal-background";
import { AiChatbotWidget } from "@/features/ai/components/ai-chatbot-widget";
import { PublicHeader } from "./components/public-header";
import { PublicFooter } from "./components/public-footer";

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
      <PublicFooter />

      <AiChatbotWidget />
    </div>
  );
}
