import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGuard() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen" aria-busy="true" aria-label="Đang tải dữ liệu trang">
        {/* Sidebar Skeleton */}
        <aside className="hidden w-64 border-r border-sidebar-border bg-sidebar p-4 lg:block">
          <Skeleton className="h-8 w-32" />
          <div className="mt-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <main className="flex-1">
          {/* Header Skeleton */}
          <header className="flex h-16 items-center border-b border-border px-6">
            <Skeleton className="h-6 w-24" />
          </header>

          {/* Page Content Skeleton */}
          <div className="p-6 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-6 md:grid-cols-3">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
