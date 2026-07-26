import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ROUTES } from "@/router/route-constants";
import { GuestRoute } from "@/router/guards/guest-route";
import { RoleGuard } from "@/router/guards/role-guard";
import { PublicLayout } from "@/layouts/public-layout";
import { AuthCardLayout } from "@/layouts/auth-card-layout";
import { StudentDashboardLayout } from "@/layouts/student-dashboard-layout";
import { LecturerDashboardLayout } from "@/layouts/lecturer-dashboard-layout";
import { AdminDashboardLayout } from "@/layouts/admin-dashboard-layout";

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
const DocumentDetailPage = lazy(() => import("@/pages/document-detail-page"));
const NewsPage = lazy(() => import("@/pages/news-page"));
const CompetitionsPage = lazy(() => import("@/pages/competitions-page"));
const AboutPage = lazy(() => import("@/pages/about-page"));
const ToolkitPage = lazy(() => import("@/pages/toolkit-page"));

// Lazy load authenticated private workspace pages
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const PracticePage = lazy(() => import("@/pages/practice-page"));
const HistoryPage = lazy(() => import("@/pages/history-page"));

// Lazy load fallback pages
const NotFoundPage = lazy(() => import("@/pages/not-found-page"));

// Lazy load admin pages
const AdminDocumentsPage = lazy(() => import("@/pages/admin/documents/admin-documents-page"));
const AdminDocumentFormPage = lazy(() => import("@/pages/admin/documents/admin-document-form-page"));

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
        path: `${ROUTES.DOCUMENTS}/:slug`,
        element: (
          <Suspense fallback={null}>
            <DocumentDetailPage />
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
      {
        path: ROUTES.TOOLKIT,
        element: (
          <Suspense fallback={null}>
            <ToolkitPage />
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

  // 3. Private Workspace Area - STUDENT
  {
    element: <RoleGuard allowedRoles={["STUDENT"]} />,
    children: [
      {
        element: <StudentDashboardLayout />,
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

  // 4. Private Workspace Area - LECTURER
  {
    element: <RoleGuard allowedRoles={["LECTURER"]} />,
    children: [
      {
        element: <LecturerDashboardLayout />,
        children: [
          {
            path: "/lecturer", // Placeholder
            element: <div className="p-8">Lecturer Dashboard Coming Soon</div>,
          },
        ],
      },
    ],
  },

  // 5. Private Workspace Area - ADMIN
  {
    element: <RoleGuard allowedRoles={["ADMIN"]} />,
    children: [
      {
        element: <AdminDashboardLayout />,
        children: [
          {
            path: "/admin", // Placeholder Dashboard
            element: <div className="p-8">Admin Dashboard Coming Soon</div>,
          },
          {
            path: "/admin/documents",
            element: (
              <Suspense fallback={null}>
                <AdminDocumentsPage />
              </Suspense>
            ),
          },
          {
            path: "/admin/documents/new",
            element: (
              <Suspense fallback={null}>
                <AdminDocumentFormPage />
              </Suspense>
            ),
          },
          {
            path: "/admin/documents/:slug/edit",
            element: (
              <Suspense fallback={null}>
                <AdminDocumentFormPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },

  // 6. Catch-all Not Found
  {
    path: "*",
    element: (
      <Suspense fallback={null}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
