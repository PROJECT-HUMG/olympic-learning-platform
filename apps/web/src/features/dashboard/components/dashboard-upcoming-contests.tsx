import { Trophy, Calendar } from "lucide-react";
import { DASHBOARD_UPCOMING_CONTESTS_MOCK } from "../data/dashboard-mock-data";

export function DashboardUpcomingContests() {
  return (
    <section className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
          <Trophy className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Kỳ Thi Nổi Bật</h3>
          <p className="text-xs text-muted-foreground">Kỳ thi sắp tới của bạn</p>
        </div>
      </div>

      <div className="space-y-3">
        {DASHBOARD_UPCOMING_CONTESTS_MOCK.map((comp) => (
          <div
            key={comp.id}
            className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                {comp.registered ? "Đã đăng ký" : "Chưa đăng ký"}
              </span>
              <span className="text-[11px] text-muted-foreground">{comp.duration}</span>
            </div>
            <h4 className="text-xs font-semibold text-foreground leading-snug">{comp.title}</h4>
            <p className="text-[11px] text-muted-foreground flex items-center">
              <Calendar className="mr-1 size-3 text-primary" />
              {comp.startTime}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
