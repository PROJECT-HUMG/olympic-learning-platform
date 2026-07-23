import { Link } from "react-router-dom";
import { Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { ROUTES } from "@/router/route-constants";

export function DashboardWelcomeBanner() {
  const { data: user } = useCurrentUser();

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            <span>Góc Học Tập Cá Nhân</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Chào mừng trở lại, {user?.fullName || user?.username || "Học viên"}!
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Tiếp tục hành trình ôn luyện Olympic. Bạn đã hoàn thành <strong className="font-semibold text-foreground">68%</strong> tiến trình học tập tháng này!
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          <Button asChild size="sm" className="rounded-xl">
            <Link to={ROUTES.PRACTICE}>
              <Play className="mr-2 size-4" />
              Bắt đầu luyện tập
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
