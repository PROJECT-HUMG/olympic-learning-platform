import { Badge } from "@/components/ui/badge";
import type { PostStatus } from "../types/post.types";

interface PostStatusBadgeProps {
  status: PostStatus | string;
  className?: string;
}

export function PostStatusBadge({ status, className }: PostStatusBadgeProps) {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "default";
      case "DRAFT":
        return "secondary";
      case "ARCHIVED":
        return "outline";
      default:
        return "outline";
    }
  };

  const getLabel = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "Đã xuất bản";
      case "DRAFT":
        return "Bản nháp";
      case "ARCHIVED":
        return "Lưu trữ";
      default:
        return status;
    }
  };

  return (
    <Badge variant={getBadgeVariant(status) as any} className={className}>
      {getLabel(status)}
    </Badge>
  );
}
