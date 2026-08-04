import { Badge } from "@/components/ui/badge";
import type { PostType } from "../types/post.types";

interface PostBadgeProps {
  type: PostType | string;
  className?: string;
}

export function PostBadge({ type, className }: PostBadgeProps) {
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "BLOG":
        return "default";
      case "NEWS":
        return "destructive";
      case "ANNOUNCEMENT":
        return "secondary";
      default:
        return "outline";
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

  return (
    <Badge variant={getBadgeVariant(type) as any} className={className}>
      {getLabel(type)}
    </Badge>
  );
}
