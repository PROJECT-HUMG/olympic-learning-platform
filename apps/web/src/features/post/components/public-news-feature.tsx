import { PageHeader } from "@/components/ui/page-header";
import type { FormEvent } from "react";
import { Bell, Newspaper, Pin, RefreshCw } from "lucide-react";
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
  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("q") || "").trim();
    setSearchParams(changedParams({ q: value || undefined, page: undefined }));
  };
  const reset = () => setSearchParams({});
  const pageOutOfRange = Boolean(feed.data && currentPage > Math.max(1, feed.data.totalPages));

  return (
    <div className="page-shell page-shell--public school-news">
      <PageHeader title="Bảng tin học đường" description="Thông báo cần nhớ, chuyện trong trường và những điều đáng đọc."
        actions={<Button asChild variant="outline"><a href="#school-news-feed"><Newspaper aria-hidden="true" />Xem bài viết</a></Button>} />

      {showPriority && (priority.isLoading || priority.isError || Boolean(priority.data?.content.length)) && (
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
        <div className="school-news__feed-header">
          <div>
            <h2 id="school-news-feed-title">{hasFilters ? "Tìm trong bảng tin" : "Tất cả bài viết"}</h2>
            <p aria-live="polite">
              {keyword ? <>Từ khóa “{keyword}”{feed.data ? ` · ${feed.data.totalElements} bài viết` : ""}</> : "Theo dõi những cập nhật mới nhất."}
            </p>
          </div>
          <form key={searchParams.toString()} role="search" onSubmit={search} className="school-news__search">
            <label className="sr-only" htmlFor="school-news-search">Tìm bài viết</label>
            <SearchInput id="school-news-search" type="search" name="q" defaultValue={keyword} placeholder="Tìm trong bảng tin…" className="bg-card" />
            <Button type="submit" variant="secondary">Tìm</Button>
          </form>
        </div>

        <nav className="school-news__categories" aria-label="Loại bài viết">
          {categories.map((category) => (
            <Link
              key={category.value}
              to={{ search: changedParams({ type: category.value === "ALL" ? undefined : category.value, page: undefined }).toString() }}
              aria-current={type === category.value ? "page" : undefined}
            >
              {category.value === "ANNOUNCEMENT" && <Bell aria-hidden="true" />}
              {category.label}
            </Link>
          ))}
        </nav>

        {hasFilters && (
          <div className="school-news__filter-summary">
            <span>{feed.isError ? "Chưa tải được kết quả" : feed.data ? `${feed.data.totalElements} bài viết phù hợp` : "Đang tìm bài viết…"}</span>
            <Button type="button" variant="ghost" onClick={reset}>Xóa bộ lọc</Button>
          </div>
        )}

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
            <p>Trang {currentPage} / {feed.data.totalPages}</p>
            <AppPagination currentPage={currentPage} totalPages={feed.data.totalPages} siblingCount={0} onPageChange={(page) => setSearchParams(changedParams({ page: page === 1 ? undefined : String(page) }))} />
          </div>
        )}
      </section>
    </div>
  );
}
