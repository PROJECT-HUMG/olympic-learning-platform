import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { EyeIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { PostThumbnail } from "./post-thumbnail";
import type { PostSummaryResponse } from "../types/post.types";

interface PostCardProps {
  post: PostSummaryResponse;
  className?: string;
  onClick?: (post: PostSummaryResponse) => void;
}

const getPostTypeInfo = (type: string) => {
  switch (type) {
    case "BLOG":
      return { label: "Blog", colorClass: "text-blue-500 dark:text-blue-400" };
    case "NEWS":
      return { label: "Tin tức", colorClass: "text-rose-500 dark:text-rose-400" };
    case "ANNOUNCEMENT":
      return { label: "Thông báo", colorClass: "text-amber-600 dark:text-amber-400" };
    default:
      return { label: "Bài viết", colorClass: "text-muted-foreground" };
  }
};

export function PostCard({ post, className, onClick }: PostCardProps) {
  const formattedDate = post.publishedAt
    ? format(new Date(post.publishedAt), "dd/MM/yyyy", { locale: vi })
    : "Chưa cập nhật";

  const typeInfo = getPostTypeInfo(post.type);

  return (
    <Card
      className={`group overflow-hidden flex flex-col rounded-2xl bg-card border-border/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${onClick ? "cursor-pointer" : ""
        } ${className || ""}`}
      onClick={() => onClick?.(post)}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <PostThumbnail
          src={post.thumbnailUrl}
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <CardHeader className="p-5 pb-2">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-wider uppercase">
          <span className={typeInfo.colorClass}>{typeInfo.label}</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="text-muted-foreground font-medium">{formattedDate}</span>
        </div>
        <h3 className="line-clamp-2 text-lg font-bold leading-snug group-hover:text-primary transition-colors">
          {post.title}
        </h3>
      </CardHeader>

      <CardContent className="p-5 pt-1 flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
          {post.summary}
        </p>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex items-center justify-between text-xs text-muted-foreground mt-auto">
        <div className="flex items-center gap-2">
          {post.author?.avatarUrl ? (
            <img src={post.author.avatarUrl} alt={post.author.fullName} className="w-6 h-6 rounded-full object-cover ring-1 ring-border" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-1 ring-border">
              {post.author?.fullName?.charAt(0) || "U"}
            </div>
          )}
          <span className="font-medium">{post.author?.fullName || "Ẩn danh"}</span>
        </div>

        <div className="flex items-center gap-1.5 font-medium bg-muted/50 px-2 py-1 rounded-md">
          <EyeIcon className="h-3.5 w-3.5" />
          <span>{post.viewCount}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
