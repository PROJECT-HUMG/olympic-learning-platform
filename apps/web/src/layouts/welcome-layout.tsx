import type { ReactNode } from "react";
import { CinematicScene } from "@/components/ui/cinematic-scene";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import "./welcome-layout.css";
import "./auth-video-layout.css";

export function WelcomeLayout({
  children,
  animated = false,
  contentSide = "left",
}: {
  children: ReactNode;
  animated?: boolean;
  contentSide?: "left" | "right";
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  return (
    <div className={`welcome-layout${animated ? " welcome-layout--auth-video" : ""}`} data-content-side={contentSide}>
      {animated && isDesktop && <div className="welcome-layout__scene" aria-hidden="true">
        <CinematicScene animated />
      </div>}
      <header className="welcome-layout__header">
        <Logo className="welcome-layout__brand" imageClassName="h-12" />
        <ThemeToggle />
      </header>

      <main className="welcome-layout__main">
        <div className="welcome-layout__content">{children}</div>
        {!animated && <aside className="welcome-layout__context">
          <p className="welcome-layout__institution">Olympic HUMG</p>
          <h2>Không gian học tập của sinh viên HUMG.</h2>
          <p>Tài liệu, thành tích và công cụ hỗ trợ việc học — trong một tài khoản.</p>
        </aside>}
      </main>
    </div>
  );
}
