import { PublicPageHeader } from "@/components/ui/public-page-header";
import { useUrlListSearch } from "@/hooks/use-list-search";
import { Bell, Pin, RefreshCw } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { AppPagination } from "@/components/ui/app-pagination";
import { usePosts } from "@/features/post/hooks/use-posts";
import { NewsList } from "./news-list";
import { PostListItem } from "./post-list-item";
import "./public-news-feature.css";

const categories = [
  { value: "ALL", label: "Tất cả" },
  { value: "ANNOUNCEMENT", label: "Thông báo" },
  { value: "NEWS", label: "Tin tức" },
  { value: "BLOG", label: "Blog" },
];

export function PublicNewsFeature() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("q")?.trim() || "";
  const requestedType = searchParams.get("type");
  const type = categories.some((category) => category.value === requestedType) ? requestedType! : "ALL";
  const requestedPage = Number(searchParams.get("page") || "1");
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 && requestedPage <= 2147483647 ? requestedPage : 1;
  const hasFilters = type !== "ALL" || Boolean(keyword);
  const showPriority = !hasFilters && currentPage === 1;

  // Keep the same collection on every page. Pinned posts remain in the full
  // feed as well as the spotlight, so none disappear beyond its three slots.
  const feed = usePosts({
    page: currentPage - 1,
    size: 9,
    type: type === "ALL" ? undefined : type,
    keyword: keyword || undefined,
    sort: "publishedAt,desc",
  });
  const priority = usePosts(
    { page: 0, size: 3, pinned: true, sort: "publishedAt,desc" },
    { enabled: showPriority },
  );

  const changedParams = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    return next;
  };
  const search = useUrlListSearch(keyword, value => setSearchParams(previous => { const next = new URLSearchParams(previous); if (value) next.set("q", value); else next.delete("q"); next.delete("page"); return next; }, { replace: true }));
  const reset = () => { search.resetDraft(); setSearchParams(previous => { const next = new URLSearchParams(previous); for (const key of ["q", "type", "page"]) next.delete(key); return next; }); };
  const pageOutOfRange = Boolean(feed.data && currentPage > Math.max(1, feed.data.totalPages));
  const showPinned = showPriority && (priority.isLoading || priority.isError || Boolean(priority.data?.content.length));

  return (
    <div className="page-shell page-shell--public school-news">
      <PublicPageHeader breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Bảng tin" }]} title="Bảng tin" description="Thông báo và bài viết của Olympic HUMG." />

      <section className="school-news__discovery filter-panel" aria-labelledby="school-news-discovery-title">
        <div role="search" className="school-news__search">
          <label id="school-news-discovery-title" htmlFor="school-news-search" className="sr-only">Tìm bài viết</label>
          <SearchInput {...search.input} id="school-news-search" type="search" name="q" placeholder="Tìm trong bảng tin…" />
        </div>
        <div className="school-news__type-controls">
          <nav className="school-news__categories" aria-label="Loại bài viết">
            {categories.map(category => (
              <Button key={category.value} asChild variant={type === category.value ? "secondary" : "ghost"}>
                <Link to={{ search: changedParams({ type: category.value === "ALL" ? undefined : category.value, page: undefined }).toString() }} aria-current={type === category.value ? "page" : undefined}>
                  {category.value === "ANNOUNCEMENT" && <Bell aria-hidden="true" />}{category.label}
                </Link>
              </Button>
            ))}
          </nav>
          {hasFilters && <Button type="button" variant="ghost" onClick={reset}>Xóa bộ lọc</Button>}
        </div>
        {keyword && <p className="school-news__filter-summary" aria-live="polite">Từ khóa “{keyword}”</p>}

      </section>

      <p className="list-search-status" role="status">{search.pending || feed.isFetching ? "Đang cập nhật bảng tin…" : ""}</p>
      <div className={"school-news__body" + (showPinned ? " school-news__body--with-pinned" : "")}>
      {showPinned && (
        <section className="school-news__pinned" aria-labelledby="school-news-pinned-title" aria-busy={priority.isFetching}>
          <div className="school-news__pinned-heading">
            <span className="school-news__pin"><Pin aria-hidden="true" /></span>
            <div>
              <h2 id="school-news-pinned-title">Được ghim</h2>
              <p>Đọc trước để không bỏ lỡ.</p>
            </div>
          </div>
          {priority.isLoading ? (
            <div className="school-news__pinned-loading" role="status">Đang tải bài viết được ghim…</div>
          ) : priority.isError ? (
            <div className="school-news__pinned-error" role="alert">
              <p>Chưa tải được bài viết được ghim.</p>
              <Button type="button" variant="outline" onClick={() => void priority.refetch()} disabled={priority.isFetching}>
                <RefreshCw aria-hidden="true" /> Thử lại phần được ghim
              </Button>
            </div>
          ) : (
            <div className="school-news__pinned-posts">
              {priority.data?.content.map((post) => <PostListItem key={post.id} post={post} priority variant="board" />)}
            </div>
          )}
        </section>
      )}

      <section className="school-news__feed" id="school-news-feed" aria-labelledby="school-news-feed-title">
        <div className="school-news__feed-heading">
          <h2 id="school-news-feed-title">{hasFilters ? "Bài viết phù hợp" : "Tất cả bài viết"}</h2>
          {!feed.isError && feed.data && <p>{feed.data.totalElements} bài viết · Mới nhất trước</p>}
        </div>

        {pageOutOfRange && !feed.isError ? (
          <div className="school-news__state" role="status">
            <h3>Trang này chưa có bài viết.</h3>
            <p>Quay về trang đầu để xem các bài đang có.</p>
            <Button type="button" variant="outline" onClick={() => setSearchParams(changedParams({ page: undefined }))}>Về trang đầu</Button>
          </div>
        ) : (
          <NewsList
            posts={feed.data?.content}
            isLoading={feed.isLoading}
            isError={feed.isError}
            isEmpty={!feed.data?.content.length}
            isRetrying={feed.isFetching}
            hasFilters={hasFilters}
            onRetry={() => void feed.refetch()}
            onReset={reset}
          />
        )}

        {!feed.isError && !pageOutOfRange && feed.data && feed.data.totalPages > 1 && (
          <div className="school-news__pagination">
            <AppPagination currentPage={currentPage} totalPages={feed.data.totalPages} siblingCount={0} onPageChange={(page) => setSearchParams(changedParams({ page: page === 1 ? undefined : String(page) }))} />
          </div>
        )}
      </section>
      </div>
    </div>
  );
}
