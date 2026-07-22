import { useState, type MouseEvent } from "react";
import { Outlet } from "react-router-dom";

export function PublicLayout() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="group relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-6 lg:p-8"
    >
      {/* Interactive Mouse Spotlight Glow Layer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--color-primary, #3b82f6) 0%, transparent 70%)`,
          opacity: 0.08,
        }}
        aria-hidden="true"
      />

      {/* Mouse Pointer Grid Spotlight Highlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#64748b_1.2px,transparent_1.2px)] [background-size:20px_20px]"
        style={{
          maskImage: `radial-gradient(350px circle at ${mousePosition.x}px ${mousePosition.y}px, #000 20%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(350px circle at ${mousePosition.x}px ${mousePosition.y}px, #000 20%, transparent 100%)`,
        }}
        aria-hidden="true"
      />

      {/* Base Background Dot Matrix Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-50"
        aria-hidden="true"
      />

      {/* Ambient Soft Center Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[450px] rounded-full bg-primary/10 blur-[100px] dark:bg-primary/15"
        aria-hidden="true"
      />

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-xl backdrop-blur-md sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
