import { Link } from "react-router-dom";
import { BookOpen, CalendarDays, Newspaper, User, ArrowUpRight } from "lucide-react";
import { PageSection } from "@/components/ui/page-section";
import { ROUTES } from "@/router/route-constants";

const links = [
  { href: ROUTES.DOCUMENTS, label: "Kho tài liệu", icon: BookOpen },
  { href: ROUTES.NEWS, label: "Bảng tin", icon: Newspaper },
  { href: ROUTES.DAILY, label: "Daily của tôi", icon: CalendarDays },
  { href: ROUTES.PROFILE, label: "Hồ sơ cá nhân", icon: User },
];

export function DashboardQuickActions() {
  return <PageSection title="Khám phá và cá nhân" className="dashboard-task-group">
    <nav aria-label="Lối tắt học tập" className="flex flex-col">
      {links.map(item => <Link key={item.href} to={item.href} className="dashboard-shortcut">
        <item.icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 text-sm">{item.label}</span>
        <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </Link>)}
    </nav>
  </PageSection>;
}
