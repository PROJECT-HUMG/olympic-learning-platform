import { DashboardWelcomeBanner } from "@/features/dashboard/components/dashboard-welcome-banner";
import { DashboardContinueLearning } from "@/features/dashboard/components/dashboard-continue-learning";
import { DashboardRecentActivities } from "@/features/dashboard/components/dashboard-recent-activities";
import { DashboardQuickActions } from "@/features/dashboard/components/dashboard-quick-actions";
import { DashboardUpcomingContests } from "@/features/dashboard/components/dashboard-upcoming-contests";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <DashboardWelcomeBanner />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (2 Cols): Learning Progress & Recent Activity */}
        <div className="space-y-8 lg:col-span-2">
          <DashboardContinueLearning />
          <DashboardRecentActivities />
        </div>

        {/* Right Column (1 Col): Quick Actions & Upcoming Contests */}
        <div className="space-y-8">
          <DashboardQuickActions />
          <DashboardUpcomingContests />
        </div>
      </div>
    </div>
  );
}
