import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import { RouteSuspense } from "./route-suspense";
import { ROUTES } from "@/router/route-constants";
import { GuestRoute } from "@/router/guards/guest-route";
import { RoleGuard } from "@/router/guards/role-guard";
import { PublicLayout } from "@/layouts/public-layout";
import { AuthCardLayout } from "@/layouts/auth-card-layout";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { ProtectedRoute } from "@/router/guards/protected-route";

// Eagerly load lightweight Auth page wrappers for instant rendering without Suspense delays
import LoginPage from "@/pages/auth/login-page";
import RegisterPage from "@/pages/auth/register-page";
import VerifyEmailPage from "@/pages/auth/verify-email-page";
import ForgotPasswordPage from "@/pages/auth/forgot-password-page";
import ResetPasswordPage from "@/pages/auth/reset-password-page";
import { HonorsPage, HonorDetailPage, RankingsPage, AchievementProfilePage, MyAchievementsPage, AdminRecognitionPage } from "@/features/recognition/lazy-pages";

// Lazy load portal public pages
const HomePage = lazy(() => import("@/pages/home-page"));
const SubjectsPage = lazy(() => import("@/pages/subjects-page"));
const DocumentsPage = lazy(() => import("@/pages/documents-page"));
const DocumentDetailPage = lazy(() => import("@/pages/document-detail-page"));
const NewsPage = lazy(() => import("@/pages/news-page"));
const NewsDetailPage = lazy(() => import("@/pages/news-detail-page"));
const CompetitionsPage = lazy(() => import("@/pages/competitions-page"));
const AboutPage = lazy(() => import("@/pages/about-page"));
const ToolkitPage = lazy(() => import("@/pages/toolkit-page"));
const StudyRoomPage = lazy(() => import("@/pages/study-room-page"));

// Lazy load authenticated private workspace pages
const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const PracticePage = lazy(() => import("@/pages/practice-page"));
const HistoryPage = lazy(() => import("@/pages/history-page"));
const AssessmentImportPage = lazy(() => import("@/pages/assessment-import-page"));
const QuestionBankPage = lazy(() => import("@/pages/question-bank-page"));
const QuestionDetailPage = lazy(() => import("@/pages/question-detail-page"));

// Lazy load fallback pages
const NotFoundPage = lazy(() => import("@/pages/not-found-page"));

// Lazy load admin/management pages
const DocumentsManagementPage = lazy(() => import("@/pages/dashboard/documents/documents-management-page"));
const PostManagementPage = lazy(() => import("@/pages/dashboard/posts/post-management-page"));
const AdminCategoriesPage = lazy(() => import("@/pages/dashboard/categories/admin-categories-page"));
const AdminUsersPage = lazy(() => import("@/pages/admin/users/admin-users-page"));

export const router = createBrowserRouter([
  // 1. Public Portal Area (PublicLayout with Top Navbar)
  {
    element: <PublicLayout />,
    children: [
      { path: ROUTES.HONORS, element: <RouteSuspense><HonorsPage /></RouteSuspense> },
      { path: `${ROUTES.HONORS}/:id`, element: <RouteSuspense><HonorDetailPage /></RouteSuspense> },
      { path: ROUTES.RANKINGS, element: <RouteSuspense><RankingsPage /></RouteSuspense> },
      { path: `${ROUTES.ACHIEVEMENTS}/:userId`, element: <RouteSuspense><AchievementProfilePage /></RouteSuspense> },
      {
        path: ROUTES.HOME,
        element: (
          <RouteSuspense>
            <HomePage />
          </RouteSuspense>
        ),
      },
      {
        path: ROUTES.SUBJECTS,
        element: (
          <RouteSuspense>
            <SubjectsPage />
          </RouteSuspense>
        ),
      },
      {
        path: ROUTES.DOCUMENTS,
        element: (
          <RouteSuspense>
            <DocumentsPage />
          </RouteSuspense>
        ),
      },
      {
        path: `${ROUTES.DOCUMENTS}/:slug`,
        element: (
          <RouteSuspense>
            <DocumentDetailPage />
          </RouteSuspense>
        ),
      },
      {
        path: ROUTES.NEWS,
        element: (
          <RouteSuspense>
            <NewsPage />
          </RouteSuspense>
        ),
      },
      {
        path: `${ROUTES.NEWS}/:slug`,
        element: (
          <RouteSuspense>
            <NewsDetailPage />
          </RouteSuspense>
        ),
      },
      {
        path: ROUTES.COMPETITIONS,
        element: (
          <RouteSuspense>
            <CompetitionsPage />
          </RouteSuspense>
        ),
      },
      {
        path: ROUTES.ABOUT,
        element: (
          <RouteSuspense>
            <AboutPage />
          </RouteSuspense>
        ),
      },
      {
        path: ROUTES.TOOLKIT,
        element: (
          <RouteSuspense>
            <ToolkitPage />
          </RouteSuspense>
        ),
      },
      {
        path: ROUTES.STUDY_ROOMS,
        element: <Navigate to={`${ROUTES.TOOLKIT}?tool=rooms`} replace />,
      },
      {
        path: `${ROUTES.STUDY_ROOMS}/:roomId`,
        element: <RouteSuspense><StudyRoomPage /></RouteSuspense>,
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

  // 3. Shared Private Workspace Area (Accessible by all logged-in users)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: ROUTES.PROFILE,
            element: (
              <RouteSuspense>
                <ProfilePage />
              </RouteSuspense>
            ),
          },
          {
            path: ROUTES.PRACTICE,
            element: (
              <RouteSuspense>
                <PracticePage />
              </RouteSuspense>
            ),
          },
          {
            path: ROUTES.HISTORY,
            element: (
              <RouteSuspense>
                <HistoryPage />
              </RouteSuspense>
            ),
          },
        ],
      },
    ],
  },

  // 4. Private Workspace Area - STUDENT
  {
    element: <RoleGuard allowedRoles={["STUDENT"]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: ROUTES.DASHBOARD,
            element: (
              <RouteSuspense>
                <DashboardPage />
              </RouteSuspense>
            ),
          },
          { path: ROUTES.MY_ACHIEVEMENTS, element: <RouteSuspense><MyAchievementsPage /></RouteSuspense> },
        ],
      },
    ],
  },

  // 4. Private Workspace Area - LECTURER
  {
    element: <RoleGuard allowedRoles={["LECTURER"]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/lecturer",
            element: <Navigate to="/lecturer/dashboard" replace />,
          },
          {
            path: "/lecturer/dashboard",
            element: <RouteSuspense><DashboardPage /></RouteSuspense>,
          },
          {
            path: "/lecturer/documents",
            element: (
              <RouteSuspense>
                <DocumentsManagementPage />
              </RouteSuspense>
            ),
          },
          {
            path: "/lecturer/posts",
            element: (
              <RouteSuspense>
                <PostManagementPage />
              </RouteSuspense>
            ),
          },
          {
            path: "/lecturer/questions/import",
            element: (
              <RouteSuspense>
                <AssessmentImportPage />
              </RouteSuspense>
            ),
          },
          { path: "/lecturer/questions", element: <RouteSuspense><QuestionBankPage /></RouteSuspense> },
          { path: "/lecturer/questions/:id", element: <RouteSuspense><QuestionDetailPage /></RouteSuspense> },
        ],
      },
    ],
  },

  // 5. Private Workspace Area - ADMIN
  {
    element: <RoleGuard allowedRoles={["ADMIN"]} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/admin",
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: "/admin/dashboard",
            element: <RouteSuspense><DashboardPage /></RouteSuspense>,
          },
          { path: ROUTES.ADMIN_RECOGNITION, element: <RouteSuspense><AdminRecognitionPage /></RouteSuspense> },
          {
            path: "/admin/documents",
            element: (
              <RouteSuspense>
                <DocumentsManagementPage />
              </RouteSuspense>
            ),
          },
          {
            path: "/admin/users",
            element: (
              <RouteSuspense>
                <AdminUsersPage />
              </RouteSuspense>
            ),
          },
          {
            path: "/admin/categories",
            element: (
              <RouteSuspense>
                <AdminCategoriesPage />
              </RouteSuspense>
            ),
          },
          {
            path: "/admin/posts",
            element: (
              <RouteSuspense>
                <PostManagementPage />
              </RouteSuspense>
            ),
          },
          {
            path: "/admin/questions/import",
            element: (
              <RouteSuspense>
                <AssessmentImportPage />
              </RouteSuspense>
            ),
          },
          { path: "/admin/questions", element: <RouteSuspense><QuestionBankPage /></RouteSuspense> },
          { path: "/admin/questions/:id", element: <RouteSuspense><QuestionDetailPage /></RouteSuspense> },
        ],
      },
    ],
  },

  // 6. Catch-all Not Found
  {
    path: "*",
    element: (
      <RouteSuspense>
        <NotFoundPage />
      </RouteSuspense>
    ),
  },
]);
