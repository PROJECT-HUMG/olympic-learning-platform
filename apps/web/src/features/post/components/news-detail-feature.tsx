import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, ArrowLeft, Calendar, Eye, User } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { usePost } from "@/features/post/hooks/use-post";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { PostBadge } from "@/features/post/components/post-badge";
import { ROUTES } from "@/router/route-constants";
import { Button } from "@/components/ui/button";

export function NewsDetailFeature() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading, isError } = usePost(slug || "", true);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Đang tải bài viết...</p>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <h2 className="text-2xl font-bold">Không tìm thấy bài viết</h2>
        <p className="text-muted-foreground max-w-md">
          Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Button onClick={() => navigate(ROUTES.NEWS)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const formattedDate = post.publishedAt
    ? format(new Date(post.publishedAt), "dd MMMM, yyyy", { locale: vi })
    : format(new Date(post.createdAt), "dd MMMM, yyyy", { locale: vi });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
      <Button 
        variant="ghost" 
        className="mb-6 -ml-4 text-muted-foreground hover:text-foreground"
        onClick={() => navigate(ROUTES.NEWS)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
      </Button>

      <article className="rounded-2xl border border-border/50 bg-card p-6 sm:p-10 shadow-sm">
        <header className="mb-8 border-b border-border/50 pb-8 space-y-6">
          <div className="flex items-center gap-3">
            <PostBadge type={post.type} />
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden border">
                {post.author?.avatarUrl ? (
                  <img src={post.author.avatarUrl} alt={post.author.fullName} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <span className="font-medium text-foreground">
                {post.author?.fullName || "Quản trị viên"}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{post.viewCount} lượt xem</span>
            </div>
          </div>
        </header>

        {post.thumbnailUrl && (
          <div className="mb-10 aspect-[21/9] w-full overflow-hidden rounded-xl border bg-muted">
            <img 
              src={post.thumbnailUrl} 
              alt={post.title} 
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {post.summary && (
          <div className="mb-8 text-lg font-medium italic text-muted-foreground border-l-4 border-primary/50 pl-4 py-1">
            {post.summary}
          </div>
        )}

        <RichTextViewer content={post.content} />
      </article>
    </div>
  );
}
