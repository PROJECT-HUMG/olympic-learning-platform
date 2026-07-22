import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpinDelay } from "@/hooks/use-spin-delay";

export function GuestGuard() {
  const { data: user, isLoading } = useCurrentUser();
  const showSkeleton = useSpinDelay(isLoading, { delay: 200, minDuration: 300 });

  if (isLoading) {
    if (!showSkeleton) {
      // Sub-200ms load: wait silently without flashing any skeleton
      return null;
    }

    return (
      <div
        className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-6 lg:p-8"
        aria-busy="true"
      >
        <div className="relative z-10 w-full max-w-md">
          {/* Card panel geometry matching PublicLayout + Form shape 1:1 */}
          <div className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-xl backdrop-blur-md sm:p-8 space-y-6">
            <div className="space-y-2 text-center">
              <Skeleton className="mx-auto h-8 w-36 rounded-md" />
              <Skeleton className="mx-auto h-4 w-60 rounded-md" />
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>

              <div className="space-y-1.5">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>

              <Skeleton className="h-10 w-full rounded-lg" />

              <div className="pt-2 text-center">
                <Skeleton className="mx-auto h-4 w-44 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
