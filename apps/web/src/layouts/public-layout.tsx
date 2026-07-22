import { Outlet } from "react-router-dom";
import { MagneticPhysicsGrid } from "@/components/ui/magnetic-physics-grid";

export function PublicLayout() {
  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-6 lg:p-8">
      {/* Interactive Magnetic Physics Grid Background */}
      <MagneticPhysicsGrid />

      {/* Ambient Soft Center Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[450px] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/15"
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
