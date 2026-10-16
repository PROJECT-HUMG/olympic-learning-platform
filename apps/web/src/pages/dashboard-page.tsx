import { PageSection } from "@/components/ui/page-section";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { getNavigationGroups } from "@/layouts/navigation";
import { DashboardWelcomeBanner } from "@/features/dashboard/components/dashboard-welcome-banner";
import { DashboardQuickActions } from "@/features/dashboard/components/dashboard-quick-actions";

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const staff = user?.role === "ADMIN" || user?.role === "LECTURER";
  const groups = getNavigationGroups(user?.role, user?.permissions)
    .filter(group => staff
      ? group.label === "Quản lý nội dung" || group.label === "Quản trị hệ thống"
      : group.label === "Học tập" || group.label === "Cá nhân")
    .map(group => group.label === "Cá nhân" ? {
      ...group,
      label: "Tài nguyên của tôi",
      items: group.items.filter(item => item.href === "/exams" || item.href === "/my-documents"),
    } : group)
    .filter(group => group.items.length > 0);

  return (
    <div className="page-shell">
      {/* Top Banner */}
      <DashboardWelcomeBanner />

      {/* 2-Column Responsive Layout */}
      <div className="dashboard-overview">
        {/* Main Content Column (8 cols) */}
        <div className="dashboard-overview__tasks">
          {groups.map((group) => (
            <PageSection key={group.label} title={group.label} className="dashboard-task-group">
              <div className="dashboard-shortcuts">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="dashboard-shortcut"
                  >
                    <item.icon
                      aria-hidden="true"
                      size={22}
                      className="shrink-0 text-primary"
                    />
                    <span className="min-w-0 flex-1 text-sm font-medium">
                      {item.label}
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-muted-foreground"
                    />
                  </Link>
                ))}
              </div>
            </PageSection>
          ))}
        </div>

        {/* Companion Column (4 cols) */}
        <div className="dashboard-overview__personal">
          <DashboardQuickActions />

        </div>
      </div>

      <p className="page-note">
        Luyện tập và lịch sử làm bài đang được cập nhật.{" "}
        {staff
          ? "Bạn có thể tiếp tục xây dựng ngân hàng câu hỏi và tài liệu."
          : "Hiện bạn có thể sử dụng kho tài liệu, phòng học chung và công cụ tính GPA."}
      </p>
    </div>
  );
}
