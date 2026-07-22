import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-lg sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
