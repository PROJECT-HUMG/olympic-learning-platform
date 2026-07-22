import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-6 lg:p-8">
      {/* Background Dot Matrix Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-70"
        aria-hidden="true"
      />

      {/* Ambient Soft Glow Blob */}
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
