import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { EyeIcon, ClockIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { PostThumbnail } from "./post-thumbnail";
import { PostBadge } from "./post-badge";
import type { PostSummaryResponse } from "../types/post.types";

interface PostCardProps {
  post: PostSummaryResponse;
  className?: string;
  onClick?: (post: PostSummaryResponse) => void;
}

export function PostCard({ post, className, onClick }: PostCardProps) {
  const formattedDate = post.publishedAt
    ? format(new Date(post.publishedAt), "dd/MM/yyyy", { locale: vi })
    : "Chưa cập nhật";

  return (
    <Card
      className={`overflow-hidden flex flex-col transition-all hover:shadow-md ${
        onClick ? "cursor-pointer" : ""
      } ${className || ""}`}
      onClick={() => onClick?.(post)}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <PostThumbnail
          src={post.thumbnailUrl}
          alt={post.title}
          className="h-full w-full transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <PostBadge type={post.type} />
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <h3 className="line-clamp-2 text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
          {post.title}
        </h3>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {post.summary}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground border-t mt-auto">
        <div className="flex items-center gap-1.5 mt-4">
          <ClockIcon className="h-3.5 w-3.5" />
          <span>{formattedDate}</span>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <EyeIcon className="h-3.5 w-3.5" />
            <span>{post.viewCount}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
