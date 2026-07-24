import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import type { Role } from "@/features/auth/types/auth.types";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpinDelay } from "@/hooks/use-spin-delay";

interface RoleGuardProps {
  allowedRoles: Role[];
  fallbackPath?: string;
}

export function RoleGuard({ allowedRoles, fallbackPath = ROUTES.HOME }: RoleGuardProps) {
  const { data: user, isLoading } = useCurrentUser();
  const showSkeleton = useSpinDelay(isLoading, { delay: 200, minDuration: 300 });

  if (isLoading) {
    if (!showSkeleton) return null;
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  // Not logged in -> go to login
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Logged in but role not allowed -> go to fallback (e.g. home)
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
