import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpinDelay } from "@/hooks/use-spin-delay";

export function ProtectedRoute() {
  const { data: user, isLoading } = useCurrentUser();
  const showSkeleton = useSpinDelay(isLoading, { delay: 200, minDuration: 300 });

  if (isLoading) {
    if (!showSkeleton) {
      return null;
    }

    return (
      <div className="flex min-h-screen bg-background" aria-busy="true">
        {/* Sidebar Skeleton */}
        <aside className="hidden w-64 border-r border-border bg-card p-4 lg:block">
          <Skeleton className="h-8 w-32 rounded-md" />
          <div className="mt-8 space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <main className="flex-1">
          <header className="flex h-16 items-center border-b border-border px-6">
            <Skeleton className="h-6 w-28 rounded-md" />
          </header>

          <div className="p-6 space-y-6">
            <Skeleton className="h-8 w-48 rounded-md" />
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

// Alias for backward compatibility
export { ProtectedRoute as AuthGuard };
