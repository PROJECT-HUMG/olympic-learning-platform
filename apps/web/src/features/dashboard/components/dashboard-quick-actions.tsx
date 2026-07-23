import { Link } from "react-router-dom";
import { Zap, BookOpen, History, GraduationCap, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/router/route-constants";

export function DashboardQuickActions() {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
          <Zap className="size-5" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Thao Tác Nhanh</h3>
      </div>

      <div className="grid gap-2.5">
        <Button asChild variant="outline" className="justify-start h-11 rounded-xl">
          <Link to={ROUTES.PRACTICE}>
            <BookOpen className="mr-2.5 size-4 text-primary" />
            Bắt đầu làm bài tập
          </Link>
        </Button>

        <Button asChild variant="outline" className="justify-start h-11 rounded-xl">
          <Link to={ROUTES.HISTORY}>
            <History className="mr-2.5 size-4 text-emerald-500" />
            Xem lịch sử thi
          </Link>
        </Button>

        <Button asChild variant="outline" className="justify-start h-11 rounded-xl">
          <Link to={ROUTES.DOCUMENTS}>
            <GraduationCap className="mr-2.5 size-4 text-amber-500" />
            Tải tài liệu mới
          </Link>
        </Button>

        <Button asChild variant="outline" className="justify-start h-11 rounded-xl">
          <Link to={ROUTES.PROFILE}>
            <User className="mr-2.5 size-4 text-purple-500" />
            Cập nhật hồ sơ
          </Link>
        </Button>
      </div>
    </section>
  );
}
