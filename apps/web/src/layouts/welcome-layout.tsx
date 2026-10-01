import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CinematicScene } from "@/components/ui/cinematic-scene";
import { useMediaQuery } from "@/hooks/use-media-query";
import "./welcome-layout.css";

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
    <div className="welcome-layout" data-content-side={contentSide}>
      <header className="welcome-layout__header">
        <Logo className="welcome-layout__brand" imageClassName="h-12" />
        {isDesktop && (
          <div className="welcome-layout__scene" aria-hidden="true">
            <CinematicScene animated={animated} />
          </div>
        )}
        <ThemeToggle />
      </header>

      <main className="welcome-layout__main">
        <div className="welcome-layout__content">{children}</div>
      </main>
    </div>
  );
}
