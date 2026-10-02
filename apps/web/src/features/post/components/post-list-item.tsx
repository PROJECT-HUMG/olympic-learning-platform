import { useState } from "react";
import { CalendarDays, Clock3, Pin } from "lucide-react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import { getListReturnPath } from "@/lib/list-navigation";
import { getPostDeadline } from "../lib/post-deadline";
import type { PostSummaryResponse } from "../types/post.types";
import { PostBadge } from "./post-badge";
import { PostThumbnail } from "./post-thumbnail";

export function PostListItem({ post, priority = false, variant = "card" }: { post: PostSummaryResponse; priority?: boolean; variant?: "card" | "board" }) {
  const location = useLocation();
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const illustrated = Boolean(post.thumbnailUrl) && !priority && post.thumbnailUrl !== failedImageUrl;
  const from = getListReturnPath(location.pathname + location.search + location.hash, ROUTES.NEWS);
  const deadlineState = getPostDeadline(post.expiredAt);
  const deadline = deadlineState ? new Date(post.expiredAt!) : null;
  const deadlineLabel = deadlineState === "expired" ? "Đã hết hạn"
    : deadlineState === "urgent" ? `Còn ${formatDistanceToNowStrict(deadline!, { locale: vi })}`
    : deadline ? `Hạn ${format(deadline, "dd/MM/yyyy", { locale: vi })}` : null;

  if (variant === "board") return (
    <article className={"school-news-post" + (priority ? " school-news-post--pinned" : "") + (illustrated ? " school-news-post--illustrated" : "")}>
      <Link to={ROUTES.NEWS + "/" + encodeURIComponent(post.slug)} state={{ from }} className="school-news-post__link">
        <div className="school-news-post__body">
          <div className="school-news-post__meta">
            <PostBadge type={post.type} />
            {post.pinned && !priority && <span className="school-news-post__pinned-label"><Pin aria-hidden="true" /> Được ghim</span>}
            {post.publishedAt && <time dateTime={post.publishedAt}>{format(new Date(post.publishedAt), "dd/MM/yyyy", { locale: vi })}</time>}
          </div>
          <h3>{post.title}</h3>
          {deadlineLabel && <p className="text-xs text-muted-foreground">{deadlineLabel}</p>}
          {post.summary && <p>{post.summary}</p>}
          <span className="school-news-post__read" aria-hidden="true">Đọc bài viết</span>
        </div>
        {illustrated && <img src={post.thumbnailUrl!} className="school-news-post__image" alt="" loading="lazy"
          onError={() => setFailedImageUrl(post.thumbnailUrl!)} />}
      </Link>
    </article>
  );

  return (
    <article className="group grid gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/20 sm:grid-cols-[10.5rem_1fr] sm:p-4">
      <Link to={`${ROUTES.NEWS}/${post.slug}`} state={{ from }} className="overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <PostThumbnail src={post.thumbnailUrl} alt="" className="aspect-[16/9] h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
      </Link>
      <div className="min-w-0 py-1">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <PostBadge type={post.type} />
          {priority && <span className="inline-flex items-center text-primary" title="Bài viết được ghim" aria-label="Bài viết được ghim"><Pin className="size-3.5 fill-current" /></span>}
          {deadlineLabel && <span className={`inline-flex items-center gap-1 font-medium ${deadlineState !== "future" ? "text-destructive" : "text-muted-foreground"}`}><Clock3 className="size-3" />{deadlineLabel}</span>}
        </div>
        <Link to={`${ROUTES.NEWS}/${post.slug}`} state={{ from }} className="block text-base font-semibold leading-snug text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring sm:text-lg">
          {post.title}
        </Link>
        {post.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{post.summary}</p>}
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />{post.publishedAt ? format(new Date(post.publishedAt), "dd/MM/yyyy", { locale: vi }) : "Chưa cập nhật"}</p>
      </div>
    </article>
  );
}
