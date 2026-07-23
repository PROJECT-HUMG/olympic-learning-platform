import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ROUTES } from "@/router/route-constants";
import { ProtectedRoute } from "@/router/guards/protected-route";
import { GuestRoute } from "@/router/guards/guest-route";
import { PublicLayout } from "@/layouts/public-layout";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { AuthCardLayout } from "@/layouts/auth-card-layout";

// Eagerly load lightweight Auth page wrappers for instant rendering without Suspense delays
import LoginPage from "@/pages/auth/login-page";
import RegisterPage from "@/pages/auth/register-page";
import VerifyEmailPage from "@/pages/auth/verify-email-page";
import ForgotPasswordPage from "@/pages/auth/forgot-password-page";
import ResetPasswordPage from "@/pages/auth/reset-password-page";

// Lazy load portal public pages
const HomePage = lazy(() => import("@/pages/home-page"));
const SubjectsPage = lazy(() => import("@/pages/subjects-page"));
const DocumentsPage = lazy(() => import("@/pages/documents-page"));
const NewsPage = lazy(() => import("@/pages/news-page"));
const CompetitionsPage = lazy(() => import("@/pages/competitions-page"));
const AboutPage = lazy(() => import("@/pages/about-page"));

// Lazy load authenticated private workspace pages
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const PracticePage = lazy(() => import("@/pages/practice-page"));
const HistoryPage = lazy(() => import("@/pages/history-page"));

// Lazy load fallback pages
const NotFoundPage = lazy(() => import("@/pages/not-found-page"));

export const router = createBrowserRouter([
  // 1. Public Portal Area (PublicLayout with Top Navbar)
  {
    element: <PublicLayout />,
    children: [
      {
        path: ROUTES.HOME,
        element: (
          <Suspense fallback={null}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.SUBJECTS,
        element: (
          <Suspense fallback={null}>
            <SubjectsPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.DOCUMENTS,
        element: (
          <Suspense fallback={null}>
            <DocumentsPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.NEWS,
        element: (
          <Suspense fallback={null}>
            <NewsPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.COMPETITIONS,
        element: (
          <Suspense fallback={null}>
            <CompetitionsPage />
          </Suspense>
        ),
      },
      {
        path: ROUTES.ABOUT,
        element: (
          <Suspense fallback={null}>
            <AboutPage />
          </Suspense>
        ),
      },
    ],
  },

  // 2. Auth Area (GuestRoute - Only accessible when logged out)
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthCardLayout />,
        children: [
          {
            path: ROUTES.LOGIN,
            element: <LoginPage />,
          },
          {
            path: ROUTES.REGISTER,
            element: <RegisterPage />,
          },
          {
            path: ROUTES.VERIFY_EMAIL,
            element: <VerifyEmailPage />,
          },
          {
            path: ROUTES.FORGOT_PASSWORD,
            element: <ForgotPasswordPage />,
          },
          {
            path: ROUTES.RESET_PASSWORD,
            element: <ResetPasswordPage />,
          },
        ],
      },
    ],
  },

  // 3. Private Workspace Area (ProtectedRoute - Only accessible when logged in)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: ROUTES.DASHBOARD,
            element: (
              <Suspense fallback={null}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.PROFILE,
            element: (
              <Suspense fallback={null}>
                <ProfilePage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.PRACTICE,
            element: (
              <Suspense fallback={null}>
                <PracticePage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.HISTORY,
            element: (
              <Suspense fallback={null}>
                <HistoryPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  // 4. Catch-all Not Found
  {
    path: "*",
    element: (
      <Suspense fallback={null}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
