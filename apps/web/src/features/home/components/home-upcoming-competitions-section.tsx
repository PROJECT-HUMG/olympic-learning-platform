import { Link } from "react-router-dom";
import { Flame, ChevronRight, Users, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPCOMING_COMPETITIONS } from "../data/home-mock-data";
import { ROUTES } from "@/router/route-constants";

export function HomeUpcomingCompetitionsSection() {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Flame className="size-6 text-amber-500" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Kỳ Thi Sắp Khởi Tranh</h2>
            <p className="text-sm text-muted-foreground mt-1">Thử sức trực tiếp với đồng đạo toàn quốc</p>
          </div>
        </div>
        <Link
          to={ROUTES.COMPETITIONS}
          className="flex items-center text-sm font-medium text-primary hover:underline"
        >
          Tất cả kỳ thi <ChevronRight className="ml-1 size-4" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {UPCOMING_COMPETITIONS.map((comp) => (
          <div
            key={comp.id}
            className="flex flex-col justify-between rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card p-6 shadow-xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {comp.status}
                </span>
                <span className="flex items-center text-xs text-muted-foreground">
                  <Users className="mr-1 size-3.5" />
                  {comp.participants} thí sinh
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground">{comp.title}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center">
                  <Calendar className="mr-1.5 size-3.5 text-primary" />
                  {comp.startTime}
                </span>
                <span className="flex items-center">
                  <Clock className="mr-1.5 size-3.5 text-primary" />
                  Thời gian: {comp.duration}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-border/60 pt-4 flex justify-end">
              <Button asChild size="sm">
                <Link to={ROUTES.COMPETITIONS}>Đăng ký ngay</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
