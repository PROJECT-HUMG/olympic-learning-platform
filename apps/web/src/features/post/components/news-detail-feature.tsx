import { useRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  ChevronDown,
  AlertTriangle,
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
import { PostListItem } from "@/features/post/components/post-list-item";
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

      {/* Compact title + thumbnail skeleton */}
      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-4/5" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="mt-6 flex items-center gap-3 border-t border-border/40 pt-6">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <Skeleton className="h-[180px] w-full rounded-xl lg:mt-1" />
        </div>
      </div>

      {/* Article content skeleton */}
      <div className="mx-auto mt-10 max-w-4xl px-4 sm:px-6">
        <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
          <Skeleton className="h-4 w-36" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <div className="mt-8 space-y-5">
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
        <div className="mt-12 border-t border-border/40 pt-6">
          <Skeleton className="h-4 w-16" />
          <div className="mt-3 flex gap-2"><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="h-9 w-9 rounded-lg" /></div>
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
    <div className="mb-8 rounded-xl border border-border/50 bg-muted/30">
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
        {post.expiredAt && new Date(post.expiredAt) <= new Date() && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div><p className="font-semibold">Bài viết này đã hết hiệu lực</p><p className="mt-1">Thông tin có thể đã thay đổi. Hãy xem các thông báo mới nhất trước khi thực hiện.</p></div>
          </div>
        )}
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

      {/* ── Compact title and thumbnail header ── */}
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-4xl px-4 pt-10 sm:px-6"
      >
        <div className={`grid gap-8 ${post.thumbnailUrl ? "lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start" : ""}`}>
          <div>
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
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {readingTime} phút đọc
          </span>
          {post.expiredAt && <><span className="hidden sm:inline text-border">·</span><span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Hiệu lực đến {format(new Date(post.expiredAt), "dd/MM/yyyy", { locale: vi })}</span></>}
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
                    Cập nhật {format(new Date(post.updatedAt), "dd/MM/yyyy", { locale: vi })}
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
          </div>

          {post.thumbnailUrl && (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 p-2 lg:mt-1">
              <ImageLightbox
                src={post.thumbnailUrl}
                alt={post.title}
                containerClassName="flex max-h-[220px] w-full items-center justify-center"
                withBlurFill={false}
                className="max-h-[204px] w-full object-contain"
              />
            </div>
          )}
        </div>
      </motion.header>

      {/* ── Content Area: Sidebar + Article ── */}
      <div className="mx-auto mt-10 max-w-4xl px-4 sm:px-6">
        {/* ── Article Content ── */}
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Article contents */}
          <MobileToc contentRef={contentRef} />

          {/* Summary / Lead text */}
          {post.summary && (
            <p className="mb-10 border-l-2 border-primary/40 pl-4 text-lg font-medium leading-relaxed text-muted-foreground md:text-xl">
              {post.summary}
            </p>
          )}

          {/* Article body */}
          <div ref={contentRef}>
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl prose-img:shadow-sm">
              <RichTextViewer content={post.content} />
            </div>
          </div>

          {/* Share after reading, keeping the article column straight */}
          <div className="mt-12 border-t border-border/40 pt-6">
            <ShareButtons
              url={currentUrl}
              title={post.title}
              direction="horizontal"
            />
          </div>

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
          <div className="space-y-3">
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
                <PostListItem post={relatedPost} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
