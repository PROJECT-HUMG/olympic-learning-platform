import type { PostType } from "../types/post.types";

interface PostBadgeProps {
  type: PostType | string;
  className?: string;
}

export function PostBadge({ type, className }: PostBadgeProps) {
  const getBadgeTone = (type: string) => {
    switch (type) {
      case "ANNOUNCEMENT": return "text-amber-700 dark:text-amber-300";
      case "NEWS": return "text-primary";
      case "BLOG": return "text-teal-700 dark:text-teal-300";
      default:
        return "text-muted-foreground";
    }
  };

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

  return <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${getBadgeTone(type)} ${className || ""}`}>
    <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
    {getLabel(type)}
  </span>;
}
