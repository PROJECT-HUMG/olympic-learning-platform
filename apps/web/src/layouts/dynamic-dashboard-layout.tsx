import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { StudentDashboardLayout } from "./student-dashboard-layout";
import { AdminDashboardLayout } from "./admin-dashboard-layout";
import { LecturerDashboardLayout } from "./lecturer-dashboard-layout";
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpinDelay } from "@/hooks/use-spin-delay";

export function DynamicDashboardLayout() {
  const { data: user, isLoading } = useCurrentUser();
  const showSkeleton = useSpinDelay(isLoading, { delay: 50, minDuration: 0 });

  if (isLoading) {
    if (!showSkeleton) return null;
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  switch (user.role) {
    case "ADMIN":
      return <AdminDashboardLayout />;
    case "LECTURER":
      return <LecturerDashboardLayout />;
    case "STUDENT":
    default:
      return <StudentDashboardLayout />;
  }
}
