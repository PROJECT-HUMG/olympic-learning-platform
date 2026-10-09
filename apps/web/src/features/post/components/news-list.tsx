import { Newspaper, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListFeedback } from "@/components/ui/list-feedback";
import type { PostSummaryResponse } from "../types/post.types";
import { PostListItem } from "./post-list-item";

interface NewsListProps {
  posts?: PostSummaryResponse[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  isRetrying: boolean;
  hasFilters: boolean;
  onRetry: () => void;
  onReset: () => void;
}

export function NewsList({ posts, isLoading, isError, isEmpty, isRetrying, hasFilters, onRetry, onReset }: NewsListProps) {
  if (isLoading) return (
    <div className="school-news__loading" role="status">
      <span className="sr-only">Đang tải bảng tin…</span>
      {Array.from({ length: 3 }, (_, index) => <div key={index} aria-hidden="true"><span /><span /><span /></div>)}
    </div>
  );

  if (isError) return (
    <ListFeedback tone="error" icon={<Newspaper />} title="Chưa tải được bảng tin."
      actions={<Button type="button" variant="outline" disabled={isRetrying} onClick={onRetry}><RefreshCw aria-hidden="true" /> Thử lại bảng tin</Button>}>
      Kiểm tra kết nối rồi thử tải lại các bài viết.
    </ListFeedback>
  );

  if (isEmpty || !posts?.length) return (
    <EmptyState icon={<Newspaper />} title={hasFilters ? "Chưa tìm thấy bài viết phù hợp." : "Bảng tin chưa có bài viết."}
      actions={hasFilters && <Button type="button" variant="outline" onClick={onReset}>Xem tất cả bài viết</Button>}>
      {hasFilters ? "Thử từ khóa khác hoặc xem tất cả bài viết." : "Các thông báo và bài viết mới sẽ xuất hiện tại đây."}
    </EmptyState>
  );

  return <div className="school-news__posts">{posts.map((post) => <PostListItem key={post.id} post={post} variant="board" />)}</div>;
}
