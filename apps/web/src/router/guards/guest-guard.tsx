import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpinDelay } from "@/hooks/use-spin-delay";

export function GuestGuard() {
  const { data: user, isLoading } = useCurrentUser();
  const showSkeleton = useSpinDelay(isLoading, { delay: 200, minDuration: 300 });
  const location = useLocation();

  if (isLoading) {
    if (!showSkeleton) {
      // Sub-200ms load: wait silently without flashing any skeleton
      return null;
    }

    const isRegister = location.pathname === ROUTES.REGISTER;
    const isForgotPassword = location.pathname === ROUTES.FORGOT_PASSWORD;
    const isResetPassword = location.pathname === ROUTES.RESET_PASSWORD;

    return (
      <div
        className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-6 lg:p-8"
        aria-busy="true"
      >
        <div className="relative z-10 w-full max-w-md">
          {/* Card panel geometry matching specific route form 1:1 */}
          <div className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-xl backdrop-blur-md sm:p-8 space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2 text-center">
              <Skeleton className="mx-auto h-8 w-36 rounded-md" />
              <Skeleton className="mx-auto h-4 w-60 rounded-md" />
            </div>

            {/* Social OAuth Buttons Skeleton (Only on Login) */}
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

            {/* Form Fields Skeleton */}
            <div className="space-y-4">
              {/* Field 1: Email */}
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>

              {/* Register Extra Fields: Username & FullName */}
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

              {/* Field: Password / New Password */}
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

              {/* Register / Reset Password Extra Field: Confirm Password */}
              {(isRegister || isResetPassword) && (
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              )}

              {/* Submit Button Skeleton */}
              <Skeleton className="h-10 w-full rounded-lg" />

              {/* Footer Link Skeleton */}
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
