import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES, getDashboardRoute } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import type { Role } from "@/features/auth/types/auth.types";
import { SessionLoading } from "./session-loading";
import { useSpinDelay } from "@/hooks/use-spin-delay";
import { parseApiError } from "@/lib/api-error";
import { SessionError } from "./session-error";

interface RoleGuardProps {
  allowedRoles: Role[];
  fallbackPath?: string;
}

export function RoleGuard({ allowedRoles, fallbackPath }: RoleGuardProps) {
  const location = useLocation();
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCurrentUser();
  const showSkeleton = useSpinDelay(isLoading, { delay: 50, minDuration: 0 });

  if (isLoading) {
    return showSkeleton ? <SessionLoading /> : null;
  }

  if (!user && isError && ![401, 403].includes(parseApiError(error).status)) {
    return (
      <SessionError onRetry={() => void refetch()} retrying={isFetching} />
    );
  }

  // Not logged in -> go to login
  if (!user) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: location.pathname + location.search + location.hash }}
        replace
      />
    );
  }

  // Logged in but role not allowed -> go to fallback (e.g. home)
  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate to={fallbackPath ?? getDashboardRoute(user.role)} replace />
    );
  }

  return <Outlet />;
}
