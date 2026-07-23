import { Link } from "react-router-dom";
import { ChevronRight, Newspaper, ArrowRight } from "lucide-react";
import { LATEST_NEWS } from "../data/home-mock-data";
import { ROUTES } from "@/router/route-constants";

export function HomeLatestNewsSection() {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Tin Tức & Thông Báo</h2>
          <p className="text-sm text-muted-foreground mt-1">Tin tức mới nhất về các phong trào thi Olympic</p>
        </div>
        <Link
          to={ROUTES.NEWS}
          className="flex items-center text-sm font-medium text-primary hover:underline"
        >
          Xem tin tức <ChevronRight className="ml-1 size-4" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {LATEST_NEWS.map((news) => (
          <div
            key={news.id}
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-primary">{news.category}</span>
                <span className="flex items-center">
                  <Newspaper className="mr-1 size-3" />
                  {news.date}
                </span>
              </div>
              <h4 className="text-base font-semibold text-foreground leading-snug">{news.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{news.summary}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/60">
              <Link
                to={ROUTES.NEWS}
                className="text-xs font-medium text-primary hover:underline flex items-center"
              >
                Đọc tiếp <ArrowRight className="ml-1 size-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
