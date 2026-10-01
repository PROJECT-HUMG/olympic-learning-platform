import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { Link } from "react-router-dom";
import { ChevronRight, Newspaper, ArrowRight, Loader2 } from "lucide-react";
import { ROUTES } from "@/router/route-constants";
import { usePosts } from "@/features/post/hooks/use-posts";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { PostBadge } from "@/features/post/components/post-badge";
import { PostThumbnail } from "@/features/post/components/post-thumbnail";

export function HomeLatestNewsSection() {
  const { data, isLoading, isError, refetch, isFetching } = usePosts({
    size: 3,
    status: "PUBLISHED",
  });

  return (
    <section className="space-y-6">
      <FadeIn className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
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
      </FadeIn>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div role="alert" className="space-y-3 rounded-xl border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">Không thể tải tin tức. Hãy thử kết nối lại.</p>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>Thử lại</Button>
        </div>
      ) : !data || data.content.length === 0 ? (
        <FadeIn className="flex justify-center items-center py-12 border border-dashed rounded-xl bg-muted/20">
          <p className="text-sm text-muted-foreground">Chưa có tin tức nào mới.</p>
        </FadeIn>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {data.content.map((news, index) => {
            const formattedDate = news.publishedAt
              ? format(new Date(news.publishedAt), "dd/MM/yyyy", { locale: vi })
              : "Chưa cập nhật";

            return (
              <FadeIn
                key={news.id}
                delay={index * 0.08}
                className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="aspect-video w-full overflow-hidden relative">
                  <PostThumbnail
                    src={news.thumbnailUrl}
                    alt={news.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2">
                    <PostBadge type={news.type} />
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span className="flex items-center">
                        <Newspaper className="mr-1 size-3" />
                        {formattedDate}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {news.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {news.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60">
                    <Link
                      to={`${ROUTES.NEWS}/${news.slug}`}
                      className="text-xs font-medium text-primary hover:underline flex items-center"
                    >
                      Đọc tiếp <ArrowRight className="ml-1 size-3" />
                    </Link>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      )}
    </section>
  );
}
