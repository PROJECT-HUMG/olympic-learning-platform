import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { PublicPageHeader } from "@/components/ui/public-page-header";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppPagination } from "@/components/ui/app-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { usePosts } from "@/features/post/hooks/use-posts";
import { NewsList } from "./news-list";
import { PostListItem } from "./post-list-item";

export function PublicNewsFeature() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const keywordQuery = useDebounce(keyword, 350);
  const type = searchParams.get("type") || "ALL";
  const currentPage = Number(searchParams.get("page") || "1");
  const isDefaultFeed = type === "ALL" && !keywordQuery && currentPage === 1;
  const params = { page: Math.max(0, currentPage - 1), size: 9, type: type === "ALL" ? undefined : type, keyword: keywordQuery || undefined, pinned: isDefaultFeed ? false : undefined, sort: "publishedAt,desc" };
  const feed = usePosts(params);
  const priority = usePosts({ page: 0, size: 3, pinned: true, sort: "publishedAt,desc" }, { enabled: isDefaultFeed });

  useEffect(() => { setSearchParams((current) => { const next = new URLSearchParams(current); keywordQuery ? next.set("q", keywordQuery) : next.delete("q"); next.set("page", "1"); return next; }, { replace: true }); }, [keywordQuery, setSearchParams]);

  const update = (changes: Record<string, string | undefined>) => setSearchParams((current) => { const next = new URLSearchParams(current); Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); return next; });
  const reset = () => { setKeyword(""); setSearchParams({}); };

  return <main className="mx-auto min-h-[80vh] max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
    <PublicPageHeader title="Tin tức và thông báo" description="Thông tin Olympic mới nhất, lịch thi và hướng dẫn dành cho bạn." />
    <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm thông báo, lịch thi, hướng dẫn..." className="h-11 pl-10" /></div>
      <Tabs value={type} onValueChange={(value) => update({ type: value === "ALL" ? undefined : value, page: "1" })}><TabsList className="h-11 w-full justify-start overflow-x-auto sm:w-auto"><TabsTrigger value="ALL">Tất cả</TabsTrigger><TabsTrigger value="ANNOUNCEMENT">Thông báo</TabsTrigger><TabsTrigger value="NEWS">Tin tức</TabsTrigger><TabsTrigger value="BLOG">Blog</TabsTrigger></TabsList></Tabs>
    </div>
    {isDefaultFeed && priority.data?.content.length ? <section className="mt-10"><div className="mb-4"><h2 className="text-xl font-bold tracking-tight">Thông tin quan trọng</h2><p className="mt-1 text-sm text-muted-foreground">Những nội dung cần được ưu tiên xem trước.</p></div><div className="space-y-3">{priority.data.content.map((post) => <PostListItem key={post.id} post={post} priority />)}</div></section> : null}
    <section className="mt-10"><div className="mb-4 flex items-baseline justify-between"><h2 className="text-xl font-bold tracking-tight">{isDefaultFeed ? "Mới nhất" : "Kết quả"}</h2>{feed.data && <span className="text-sm text-muted-foreground">{feed.data.totalElements} bài viết</span>}</div><NewsList posts={feed.data?.content} isLoading={feed.isLoading} isError={feed.isError} isEmpty={!feed.data || feed.data.content.length === 0} onReset={reset} /></section>
    {feed.data && feed.data.totalPages > 1 ? <div className="mt-10 border-t border-border pt-6"><AppPagination currentPage={currentPage} totalPages={feed.data.totalPages} onPageChange={(page) => update({ page: String(page) })} /></div> : null}
  </main>;
}
