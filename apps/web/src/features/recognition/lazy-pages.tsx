import { lazy } from "react";

export const HonorsPage = lazy(() => import("@/pages/honors-page"));
export const HonorDetailPage = lazy(() => import("@/pages/honor-detail-page"));
export const RankingsPage = lazy(() => import("@/pages/rankings-page"));
export const AchievementProfilePage = lazy(() => import("@/pages/achievement-profile-page"));
export const MyAchievementsPage = lazy(() => import("@/pages/my-achievements-page"));
export const AdminRecognitionPage = lazy(() => import("@/pages/admin/recognition-page"));
