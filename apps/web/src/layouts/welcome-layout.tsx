import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import "./welcome-layout.css";

export function WelcomeLayout({
  children,
  contentSide = "left",
}: {
  children: ReactNode;
  animated?: boolean;
  contentSide?: "left" | "right";
}) {
  return (
    <div className="welcome-layout" data-content-side={contentSide}>
      <header className="welcome-layout__header">
        <Logo className="welcome-layout__brand" imageClassName="h-12" />
        <ThemeToggle />
      </header>

      <main className="welcome-layout__main">
        <div className="welcome-layout__content">{children}</div>
        <aside className="welcome-layout__context">
          <p className="welcome-layout__institution">Olympic HUMG</p>
          <h2>Không gian học tập của sinh viên HUMG.</h2>
          <p>Tài liệu, thành tích và công cụ hỗ trợ việc học — trong một tài khoản.</p>
        </aside>
      </main>
    </div>
  );
}
