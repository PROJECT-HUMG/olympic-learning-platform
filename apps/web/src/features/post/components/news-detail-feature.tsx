import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, Calendar, Eye, User, Clock } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { usePost } from "@/features/post/hooks/use-post";
import { usePosts } from "@/features/post/hooks/use-posts";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { PostBadge } from "@/features/post/components/post-badge";
import { ROUTES } from "@/router/route-constants";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PostCard } from "@/features/post/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserHoverCard } from "@/features/user/components/user-hover-card";

function calculateReadingTime(text: string): number {
  const wordsPerMinute = 250;
  const noHtml = text.replace(/<[^>]*>?/gm, "");
  const words = noHtml.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function NewsDetailFeature() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading, isError } = usePost(slug || "", true);

  // Fetch related posts (same type if possible, or just recent posts)
  const { data: relatedPosts } = usePosts(
    { size: 3, status: "PUBLISHED", type: post?.type },
    { enabled: !!post } // Only fetch after we know the post type
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
        <div className="mb-8 max-w-3xl mx-auto flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <span className="text-muted-foreground/30">/</span>
          <Skeleton className="h-4 w-32" />
          <span className="text-muted-foreground/30">/</span>
          <Skeleton className="h-4 w-48" />
        </div>

        <article className="mb-16">
          <header className="mb-10 max-w-3xl mx-auto space-y-6 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <span className="hidden sm:inline text-muted-foreground/30">•</span>
              <Skeleton className="h-4 w-32" />
              <span className="hidden sm:inline text-muted-foreground/30">•</span>
              <Skeleton className="h-4 w-24" />
            </div>
            
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-4/5 mx-auto sm:mx-0" />
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-4 border-t border-border/40">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <span className="text-muted-foreground text-sm">•</span>
              <Skeleton className="h-4 w-24" />
            </div>
          </header>

          <div className="mb-12 max-w-5xl mx-auto aspect-video sm:aspect-[21/9] w-full overflow-hidden rounded-2xl">
            <Skeleton className="h-full w-full" />
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
            <div className="h-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <div className="h-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-full" />
          </div>
        </article>
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

  const readingTime = calculateReadingTime(post.content || "");
  const filteredRelatedPosts = relatedPosts?.content.filter(p => p.id !== post.id).slice(0, 3) || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
      <div className="mb-8 max-w-3xl mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={ROUTES.HOME}>Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={ROUTES.NEWS}>Tin tức & Thông báo</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[150px] sm:max-w-[300px] truncate">
                {post.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <article className="mb-16">
        {/* HEADER SECTION */}
        <header className="mb-10 max-w-3xl mx-auto space-y-6 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <PostBadge type={post.type} />
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </span>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {readingTime} phút đọc
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-4 border-t border-border/40">
            {post.author ? (
              <UserHoverCard user={post.author as any}>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 -ml-1 rounded-md transition-colors">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border border-border/50">
                    {post.author.avatarUrl ? (
                      <img src={post.author.avatarUrl} alt={post.author.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {post.author.fullName || post.author.username}
                  </span>
                </div>
              </UserHoverCard>
            ) : (
              <div className="flex items-center gap-2 p-1 -ml-1">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border border-border/50">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Quản trị viên
                </span>
              </div>
            )}
            <span className="text-muted-foreground text-sm">•</span>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{post.viewCount} lượt xem</span>
            </div>
          </div>
        </header>

        {/* THUMBNAIL */}
        {post.thumbnailUrl && (
          <div className="mb-12 max-w-5xl mx-auto aspect-video sm:aspect-[21/9] w-full overflow-hidden rounded-2xl bg-muted shadow-sm">
            <img 
              src={post.thumbnailUrl} 
              alt={post.title} 
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* CONTENT SECTION */}
        <div className="max-w-3xl mx-auto">
          {post.summary && (
            <div className="mb-10 text-xl md:text-2xl font-medium text-muted-foreground leading-relaxed">
              {post.summary}
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl">
            <RichTextViewer content={post.content} />
          </div>

          <footer className="mt-16 pt-8 border-t border-border/50">
            {post.author ? (
              <UserHoverCard user={post.author as any}>
                <div className="flex items-center gap-4 p-6 bg-muted/30 rounded-2xl border border-border/30 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden shrink-0 border border-border/50">
                    {post.author.avatarUrl ? (
                      <img src={post.author.avatarUrl} alt={post.author.fullName} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">
                      {post.author.fullName || post.author.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Tác giả bài viết
                    </p>
                  </div>
                </div>
              </UserHoverCard>
            ) : (
              <div className="flex items-center gap-4 p-6 bg-muted/30 rounded-2xl border border-border/30">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden shrink-0 border border-border/50">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    Quản trị viên
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tác giả bài viết
                  </p>
                </div>
              </div>
            )}
          </footer>
        </div>
      </article>

      {filteredRelatedPosts.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Bài viết liên quan</h2>
            <Button variant="ghost" asChild>
              <Link to={ROUTES.NEWS}>Xem tất cả</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRelatedPosts.map((relatedPost) => (
              <PostCard 
                key={relatedPost.id} 
                post={relatedPost} 
                onClick={() => navigate(`${ROUTES.NEWS}/${relatedPost.slug}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
