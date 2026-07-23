import { Link } from "react-router-dom";
import { ChevronRight, Download } from "lucide-react";
import { FEATURED_DOCUMENTS } from "../data/home-mock-data";
import { ROUTES } from "@/router/route-constants";

export function HomeFeaturedDocumentsSection() {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Tài Liệu Ôn Luyện Nổi Bật</h2>
          <p className="text-sm text-muted-foreground mt-1">Đề thi mẫu, sách chuyên khảo và bài giải chi tiết</p>
        </div>
        <Link
          to={ROUTES.DOCUMENTS}
          className="flex items-center text-sm font-medium text-primary hover:underline"
        >
          Kho tài liệu <ChevronRight className="ml-1 size-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {FEATURED_DOCUMENTS.map((doc) => (
          <div
            key={doc.id}
            className="flex items-start gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-colors hover:bg-accent/40"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-xs">
              {doc.type}
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate">{doc.title}</h4>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{doc.size}</span>
                <span>•</span>
                <span className="flex items-center">
                  <Download className="mr-1 size-3" />
                  {doc.downloads.toLocaleString()} lượt tải
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
