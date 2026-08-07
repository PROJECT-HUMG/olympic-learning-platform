
import { PostCard } from "./post-card";
import { PostCardSkeleton } from "./post-card-skeleton";
import type { PostSummaryResponse } from "../types/post.types";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";

interface NewsListProps {
  posts?: PostSummaryResponse[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
}

export function NewsList({ posts, isLoading, isError, isEmpty }: NewsListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 lg:gap-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
        <p className="text-destructive font-medium">Đã có lỗi xảy ra</p>
        <p className="text-sm">Không thể tải danh sách tin tức. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  if (isEmpty || !posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4 border border-dashed rounded-xl bg-card/50">
        <p>Chưa có bài viết nào trong mục này.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 lg:gap-10">
      {posts.map((post) => (
        <PostCard 
          key={post.id} 
          post={post} 
          onClick={() => navigate(`${ROUTES.NEWS}/${post.slug}`)}
        />
      ))}
    </div>
  );
}
