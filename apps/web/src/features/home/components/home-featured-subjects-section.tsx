import { Link } from "react-router-dom";
import { ChevronRight, ArrowRight } from "lucide-react";
import { FEATURED_SUBJECTS } from "../data/home-mock-data";
import { ROUTES } from "@/router/route-constants";

export function HomeFeaturedSubjectsSection() {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Môn Học Nổi Bật</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Các chuyên đề kiến thức cốt lõi dành cho các đội tuyển Olympic
          </p>
        </div>
        <Link
          to={ROUTES.SUBJECTS}
          className="flex items-center text-sm font-medium text-primary hover:underline"
        >
          Xem tất cả <ChevronRight className="ml-1 size-4" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {FEATURED_SUBJECTS.map((sub) => (
          <div
            key={sub.id}
            className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-primary/50 transition-all hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {sub.tag}
                </span>
                <span className="text-xs text-muted-foreground">{sub.problemsCount} bài tập</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {sub.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {sub.description}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
              <span>{sub.studentsCount.toLocaleString()} người học</span>
              <Link
                to={ROUTES.SUBJECTS}
                className="font-medium text-foreground group-hover:text-primary flex items-center"
              >
                Học ngay <ArrowRight className="ml-1 size-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
