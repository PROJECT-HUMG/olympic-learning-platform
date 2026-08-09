import type { PostSummaryResponse } from "../types/post.types";
import { PostListItem } from "./post-list-item";
import { PostCardSkeleton } from "./post-card-skeleton";

interface NewsListProps {
  posts?: PostSummaryResponse[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  onReset?: () => void;
}

export function NewsList({ posts, isLoading, isError, isEmpty, onReset }: NewsListProps) {
  if (isLoading) return <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 6 }).map((_, index) => <PostCardSkeleton key={index} />)}</div>;
  if (isError) return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"><p className="font-semibold text-destructive">Không thể tải danh sách tin tức</p><p className="mt-1 text-sm text-muted-foreground">Vui lòng thử lại sau.</p></div>;
  if (isEmpty || !posts?.length) return <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center"><p className="font-semibold">Không tìm thấy bài viết phù hợp</p><p className="mt-1 text-sm text-muted-foreground">Hãy thử thay đổi từ khóa hoặc bộ lọc.</p>{onReset && <button type="button" onClick={onReset} className="mt-4 text-sm font-semibold text-primary underline-offset-4 hover:underline">Xóa bộ lọc</button>}</div>;
  return <div className="grid gap-4 md:grid-cols-2">{posts.map((post) => <PostListItem key={post.id} post={post} />)}</div>;
}
