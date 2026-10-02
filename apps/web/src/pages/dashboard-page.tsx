import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/ui/page-section";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { getNavigationGroups } from "@/layouts/navigation";

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const staff = user?.role === "ADMIN" || user?.role === "LECTURER";
  const groups = getNavigationGroups(user?.role).filter((group) =>
    staff
      ? group.label === "Quản lý nội dung" ||
        group.label === "Quản trị hệ thống"
      : group.label === "Học tập",
  );
  return (
    <div className="page-shell">
      <PageHeader title={staff ? "Không gian quản lý" : "Góc học tập"}
        description={<>Chào {user?.fullName || user?.username}.{" "}
          {staff ? "Chọn nội dung bạn muốn cập nhật hoặc kiểm duyệt." : "Mở tài liệu, tìm môn học hoặc vào một phòng học cùng bạn bè."}</>} />
      {groups.map((group) => (
        <PageSection key={group.label} title={group.label}>
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
      <p className="page-note">
        Luyện tập và lịch sử làm bài đang được chuẩn bị.{" "}
        {staff
          ? "Bạn có thể tiếp tục xây dựng ngân hàng câu hỏi."
          : "Hiện bạn có thể sử dụng kho tài liệu, phòng học chung và công cụ tính GPA."}
      </p>
    </div>
  );
}
