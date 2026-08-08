import { useRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Eye,
  User,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

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
import { ReadingProgressBar } from "@/features/post/components/reading-progress-bar";
import { ArticleToc } from "@/features/post/components/article-toc";
import { ShareButtons } from "@/features/post/components/share-buttons";
import { ImageLightbox } from "@/components/ui/image-lightbox";

function calculateReadingTime(text: string): number {
  const wordsPerMinute = 250;
  const noHtml = text.replace(/<[^>]*>?/gm, "");
  const words = noHtml.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/* ─────────────── Loading Skeleton ─────────────── */

function NewsDetailSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Breadcrumb skeleton */}
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <span className="text-muted-foreground/30">/</span>
          <Skeleton className="h-4 w-32" />
          <span className="text-muted-foreground/30">/</span>
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Hero image skeleton */}
      <div className="w-full">
        <Skeleton className="mx-auto aspect-[21/9] max-h-[480px] w-full max-w-6xl sm:rounded-2xl" />
      </div>

      {/* Title + metadata skeleton */}
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-4/5" />
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="mt-6 flex items-center gap-3 border-t border-border/40 pt-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar skeleton */}
        <div className="hidden space-y-4 lg:block">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        {/* Article skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <div className="h-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <div className="h-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Mobile TOC (collapsible) ─────────────── */

function MobileToc({
  contentRef,
}: {
  contentRef: React.RefObject<HTMLElement | null>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-8 rounded-xl border border-border/50 bg-muted/30 lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
      >
        <span>Mục lục bài viết</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/30 px-4 pb-4 pt-2">
              <ArticleToc contentRef={contentRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────── Main Feature ─────────────── */

export function NewsDetailFeature() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading, isError } = usePost(slug || "", true);
  const articleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: relatedPosts } = usePosts(
    { size: 3, status: "PUBLISHED", type: post?.type },
    { enabled: !!post }
  );

  if (isLoading) {
    return <NewsDetailSkeleton />;
  }

  if (isError || !post) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Không tìm thấy bài viết</h2>
        <p className="max-w-md text-muted-foreground">
          Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa khỏi hệ
          thống.
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
  const filteredRelatedPosts =
    relatedPosts?.content.filter((p) => p.id !== post.id).slice(0, 3) || [];
  const currentUrl = window.location.href;

  return (
    <div ref={articleRef} className="min-h-screen pb-16">
      {/* ── Reading Progress Bar ── */}
      <ReadingProgressBar targetRef={articleRef} />

      {/* ── Breadcrumb ── */}
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={ROUTES.HOME}>Trang chủ</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={ROUTES.NEWS}>
                  Tin tức & Thông báo
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[150px] truncate sm:max-w-[300px]">
                  {post.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* ── Full-Width Hero Image ── */}
      {post.thumbnailUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-6xl px-4 sm:px-6"
        >
          <div className="relative aspect-video max-h-[480px] w-full overflow-hidden rounded-2xl bg-muted shadow-lg sm:aspect-[21/9] group">
            <ImageLightbox
              src={post.thumbnailUrl}
              alt={post.title}
              containerClassName="h-full w-full"
              withBlurFill={true}
            />
            {/* Bottom gradient overlay for visual depth */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10" />
          </div>
        </motion.div>
      )}

      {/* ── Title + Metadata Strip ── */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl px-4 pt-10 sm:px-6"
      >
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
          {post.title}
        </h1>

        {/* Compact metadata strip */}
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <PostBadge type={post.type} />
          <span className="hidden sm:inline text-border">·</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {readingTime} phút đọc
          </span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {post.viewCount} lượt xem
          </span>
        </div>

        {/* Author strip */}
        <div className="mt-6 border-t border-border/40 pt-6">
          {post.author ? (
            <UserHoverCard user={post.author as any}>
              <div className="-ml-1 flex cursor-pointer items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-muted/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-primary/10">
                    {post.author.avatarUrl ? (
                      <img
                        src={post.author.avatarUrl}
                        alt={post.author.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary">
                        {(post.author.fullName || post.author.username || "U").charAt(0)}
                      </span>
                    )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {post.author.fullName || post.author.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tác giả bài viết
                  </p>
                </div>
              </div>
            </UserHoverCard>
          ) : (
            <div className="-ml-1 flex items-center gap-3 p-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Quản trị viên
                </p>
                <p className="text-xs text-muted-foreground">
                  Tác giả bài viết
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.header>

      {/* ── Content Area: Sidebar + Article ── */}
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[220px_1fr] lg:gap-12">
        {/* ── Desktop Sidebar (sticky) ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-8">
            <ArticleToc contentRef={contentRef} />
            <div className="border-t border-border/30 pt-4">
              <ShareButtons
                url={currentUrl}
                title={post.title}
                direction="vertical"
              />
            </div>
          </div>
        </aside>

        {/* ── Article Content ── */}
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mobile TOC */}
          <MobileToc contentRef={contentRef} />

          {/* Summary / Lead text */}
          {post.summary && (
            <p className="mb-10 text-lg font-medium leading-relaxed text-muted-foreground md:text-xl">
              {post.summary}
            </p>
          )}

          {/* Article body */}
          <div ref={contentRef}>
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl prose-img:shadow-sm">
              <RichTextViewer content={post.content} />
            </div>
          </div>

          {/* Mobile share buttons */}
          <div className="mt-10 border-t border-border/40 pt-6 lg:hidden">
            <ShareButtons
              url={currentUrl}
              title={post.title}
              direction="horizontal"
            />
          </div>

          {/* Author bio footer */}
          <footer className="mt-14 border-t border-border/50 pt-8">
            {post.author ? (
              <UserHoverCard user={post.author as any}>
                <div className="flex cursor-pointer items-center gap-4 rounded-2xl border border-border/30 bg-muted/30 p-6 transition-colors hover:bg-muted/50">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-primary/10 text-primary">
                    {post.author.avatarUrl ? (
                      <img
                        src={post.author.avatarUrl}
                        alt={post.author.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold">
                        {(post.author.fullName || post.author.username || "U").charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {post.author.fullName || post.author.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Tác giả bài viết
                    </p>
                  </div>
                </div>
              </UserHoverCard>
            ) : (
              <div className="flex items-center gap-4 rounded-2xl border border-border/30 bg-muted/30 p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-primary/10 text-primary">
                  <span className="text-xl font-bold">Q</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Quản trị viên
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tác giả bài viết
                  </p>
                </div>
              </div>
            )}
          </footer>
        </motion.article>
      </div>

      {/* ── Related Posts ── */}
      {filteredRelatedPosts.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-20 max-w-5xl px-4 sm:px-6 lg:px-8"
        >
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              Bài viết liên quan
            </h2>
            <Button variant="ghost" asChild>
              <Link to={ROUTES.NEWS}>Xem tất cả</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRelatedPosts.map((relatedPost, index) => (
              <motion.div
                key={relatedPost.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <PostCard
                  post={relatedPost}
                  onClick={() =>
                    navigate(`${ROUTES.NEWS}/${relatedPost.slug}`)
                  }
                />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
