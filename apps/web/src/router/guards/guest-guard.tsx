import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";

export function GuestGuard() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" aria-busy="true" aria-label="Đang tải dữ liệu">
        <div className="w-full max-w-md px-4 space-y-6">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-8 w-24" />
            <Skeleton className="mx-auto h-4 w-48" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
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
