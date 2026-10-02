import type { PostType } from "../types/post.types";

interface PostBadgeProps {
  type: PostType | string;
  className?: string;
}

export function PostBadge({ type, className }: PostBadgeProps) {
  const getLabel = (type: string) => {
    switch (type) {
      case "BLOG":
        return "Blog";
      case "NEWS":
        return "Tin tức";
      case "ANNOUNCEMENT":
        return "Thông báo";
      default:
        return type;
    }
  };

  return <span className={`post-type-label inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground ${className || ""}`}>
    {getLabel(type)}
  </span>;
}
