import { Outlet } from "react-router-dom";

export function ProtectedLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="p-4 font-semibold text-sidebar-foreground">
          Olympic Learning
        </div>
      </aside>

      <main className="flex-1">
        <header className="flex h-16 items-center border-b border-border px-6">
          <span className="text-sm text-muted-foreground">Header</span>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
