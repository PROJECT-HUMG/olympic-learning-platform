import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { SessionLoading } from "./session-loading";
import { useSpinDelay } from "@/hooks/use-spin-delay";
import { parseApiError } from "@/lib/api-error";
import { SessionError } from "./session-error";

export function ProtectedRoute() {
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

  if (!user) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: location.pathname + location.search + location.hash }}
        replace
      />
    );
  }

  return <Outlet />;
}

// Alias for backward compatibility
export { ProtectedRoute as AuthGuard };
