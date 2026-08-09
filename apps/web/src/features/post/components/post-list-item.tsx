import { CalendarDays, Clock3, Pin } from "lucide-react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ROUTES } from "@/router/route-constants";
import type { PostSummaryResponse } from "../types/post.types";
import { PostBadge } from "./post-badge";
import { PostThumbnail } from "./post-thumbnail";

export function PostListItem({ post, priority = false }: { post: PostSummaryResponse; priority?: boolean }) {
  const deadline = post.expiredAt ? new Date(post.expiredAt) : null;
  const daysLeft = deadline ? deadline.getTime() - Date.now() : null;
  const isUrgent = daysLeft !== null && daysLeft <= 3 * 24 * 60 * 60 * 1000;

  return (
    <article className="group grid gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/20 sm:grid-cols-[10.5rem_1fr] sm:p-4">
      <Link to={`${ROUTES.NEWS}/${post.slug}`} className="overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <PostThumbnail src={post.thumbnailUrl} alt="" className="aspect-[16/9] h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
      </Link>
      <div className="min-w-0 py-1">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <PostBadge type={post.type} />
          {priority && <span className="inline-flex items-center text-primary" title="Bài viết được ghim" aria-label="Bài viết được ghim"><Pin className="size-3.5 fill-current" /></span>}
          {deadline && <span className={`inline-flex items-center gap-1 font-medium ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}><Clock3 className="size-3" />{isUrgent ? (daysLeft! <= 0 ? "Hết hạn hôm nay" : `Còn ${formatDistanceToNowStrict(deadline, { locale: vi })}`) : `Hạn ${format(deadline, "dd/MM/yyyy", { locale: vi })}`}</span>}
        </div>
        <Link to={`${ROUTES.NEWS}/${post.slug}`} className="block text-base font-semibold leading-snug text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring sm:text-lg">
          {post.title}
        </Link>
        {post.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{post.summary}</p>}
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />{post.publishedAt ? format(new Date(post.publishedAt), "dd/MM/yyyy", { locale: vi }) : "Chưa cập nhật"}</p>
      </div>
    </article>
  );
}
