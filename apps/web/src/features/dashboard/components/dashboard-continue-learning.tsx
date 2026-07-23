import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACTIVE_COURSE_MOCK } from "../data/dashboard-mock-data";
import { ROUTES } from "@/router/route-constants";

export function DashboardContinueLearning() {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Đang Học Gần Đây</h3>
            <p className="text-xs text-muted-foreground">Khóa học bạn đang theo dõi</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {ACTIVE_COURSE_MOCK.progress}% Hoàn thành
        </span>
      </div>

      <div className="space-y-3">
        <h4 className="text-base font-semibold text-foreground">{ACTIVE_COURSE_MOCK.title}</h4>
        
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tiến độ: {ACTIVE_COURSE_MOCK.completedLessons}/{ACTIVE_COURSE_MOCK.totalLessons} bài học</span>
            <span>{ACTIVE_COURSE_MOCK.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${ACTIVE_COURSE_MOCK.progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Bài tiếp theo:</p>
            <p className="text-sm font-medium text-foreground truncate mt-0.5">
              {ACTIVE_COURSE_MOCK.nextLesson}
            </p>
          </div>
          <Button asChild size="sm" variant="default" className="shrink-0">
            <Link to={ROUTES.PRACTICE}>
              Học tiếp
              <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
