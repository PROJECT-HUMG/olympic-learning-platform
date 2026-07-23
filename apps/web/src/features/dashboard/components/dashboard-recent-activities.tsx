import { Link } from "react-router-dom";
import { CheckCircle2, Clock } from "lucide-react";
import { RECENT_ACTIVITIES_MOCK } from "../data/dashboard-mock-data";
import { ROUTES } from "@/router/route-constants";

export function DashboardRecentActivities() {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Hoạt Động Gần Đây</h3>
            <p className="text-xs text-muted-foreground">Lịch sử bài nộp & tham gia thi</p>
          </div>
        </div>
        <Link to={ROUTES.HISTORY} className="text-xs font-medium text-primary hover:underline">
          Xem tất cả
        </Link>
      </div>

      <div className="space-y-3">
        {RECENT_ACTIVITIES_MOCK.map((act) => (
          <div
            key={act.id}
            className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs transition-colors hover:bg-muted/50"
          >
            <div className="space-y-1 min-w-0 pr-4">
              <p className="font-semibold text-foreground truncate">{act.title}</p>
              <p className="text-[11px] text-muted-foreground flex items-center">
                <Clock className="mr-1 size-3" />
                {act.time}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-600 dark:text-emerald-400">
              {act.result}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
