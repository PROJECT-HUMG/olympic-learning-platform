import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES, getPostLoginRoute } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpinDelay } from "@/hooks/use-spin-delay";
import { AuthCardLayout } from "@/layouts/auth-card-layout";

export function GuestRoute() {
  const { data: user, isLoading } = useCurrentUser();
  const showSkeleton = useSpinDelay(isLoading, { delay: 50, minDuration: 0 });
  const location = useLocation();

  if (isLoading) {
    if (!showSkeleton) {
      return null;
    }

    const isRegister = location.pathname === ROUTES.REGISTER;
    const isForgotPassword = location.pathname === ROUTES.FORGOT_PASSWORD;
    const isResetPassword = location.pathname === ROUTES.RESET_PASSWORD;
    const isVerifyEmail = location.pathname === ROUTES.VERIFY_EMAIL;

    return (
      <AuthCardLayout>
        <div className="space-y-6" aria-busy="true" aria-label="Đang tải tài khoản">
          {isVerifyEmail ? (
            <div className="space-y-4 text-left">
              <Skeleton className="size-14 rounded-full" />
              <Skeleton className="h-7 w-60 max-w-full rounded-md" />
              <Skeleton className="h-4 w-72 max-w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <div className="space-y-2 text-left">
                <Skeleton className="h-8 w-36 rounded-md" />
                <Skeleton className="h-4 w-60 max-w-full rounded-md" />
              </div>

              {!isRegister && !isForgotPassword && !isResetPassword && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2.5">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                  <div className="relative flex items-center justify-center">
                    <Skeleton className="h-3 w-32 rounded-md" />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-16 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>

                {isRegister && (
                  <>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                  </>
                )}

                {!isForgotPassword && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16 rounded-md" />
                      {!isRegister && !isResetPassword && (
                        <Skeleton className="h-3 w-24 rounded-md" />
                      )}
                    </div>
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                )}

                {(isRegister || isResetPassword) && (
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                )}

                <Skeleton className="h-10 w-full rounded-lg" />

                {!isResetPassword && (
                  <div className="pt-2 text-left">
                    <Skeleton className="h-4 w-44 rounded-md" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </AuthCardLayout>
    );
  }

  if (user) {
    return <Navigate to={getPostLoginRoute(user.role, location.state?.from)} replace />;
  }

  return <Outlet />;
}

// Alias for backward compatibility
export { GuestRoute as GuestGuard };
