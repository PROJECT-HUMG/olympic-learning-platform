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
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-3 border-b border-border pb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {staff ? "Không gian quản lý" : "Góc học tập"}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Chào {user?.fullName || user?.username}.{" "}
          {staff
            ? "Chọn nội dung bạn muốn cập nhật hoặc kiểm duyệt."
            : "Mở tài liệu, tìm môn học hoặc vào một phòng học cùng bạn bè."}
        </p>
      </header>
      {groups.map((group) => (
        <section key={group.label} className="space-y-3">
          <h2 className="text-base font-medium">{group.label}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex min-h-20 items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
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
        </section>
      ))}
      <p className="text-sm leading-relaxed text-muted-foreground">
        Luyện tập và lịch sử làm bài đang được chuẩn bị.{" "}
        {staff
          ? "Bạn có thể tiếp tục xây dựng ngân hàng câu hỏi."
          : "Hiện bạn có thể sử dụng kho tài liệu, phòng học chung và công cụ tính GPA."}
      </p>
    </div>
  );
}
