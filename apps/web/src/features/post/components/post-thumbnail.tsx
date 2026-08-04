import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostThumbnailProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function PostThumbnail({ src, alt = "Post thumbnail", className }: PostThumbnailProps) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className
        )}
      >
        <ImageIcon className="h-10 w-10 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-cover", className)}
      loading="lazy"
    />
  );
}
