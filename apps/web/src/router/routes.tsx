import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ROUTES } from "@/router/route-constants";
import { AuthGuard } from "@/router/guards/auth-guard";
import { GuestGuard } from "@/router/guards/guest-guard";
import { PublicLayout } from "@/layouts/public-layout";
import { ProtectedLayout } from "@/layouts/protected-layout";

const LoginPage = lazy(() => import("@/pages/auth/login-page"));
const RegisterPage = lazy(() => import("@/pages/auth/register-page"));
const VerifyEmailPage = lazy(() => import("@/pages/auth/verify-email-page"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password-page"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/reset-password-page"));
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const NotFoundPage = lazy(() => import("@/pages/not-found-page"));

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <GuestGuard />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            path: ROUTES.LOGIN,
            element: (
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.REGISTER,
            element: (
              <Suspense fallback={<PageLoader />}>
                <RegisterPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.VERIFY_EMAIL,
            element: (
              <Suspense fallback={<PageLoader />}>
                <VerifyEmailPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.FORGOT_PASSWORD,
            element: (
              <Suspense fallback={<PageLoader />}>
                <ForgotPasswordPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.RESET_PASSWORD,
            element: (
              <Suspense fallback={<PageLoader />}>
                <ResetPasswordPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <ProtectedLayout />,
        children: [
          {
            path: ROUTES.DASHBOARD,
            element: (
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: ROUTES.HOME,
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
