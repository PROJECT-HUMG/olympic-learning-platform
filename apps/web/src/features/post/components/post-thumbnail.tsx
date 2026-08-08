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
    <div className={cn("relative h-full w-full overflow-hidden bg-muted", className)}>
      {/* Blurred background fill */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover blur-xl scale-110 opacity-60 dark:opacity-40"
        aria-hidden="true"
        loading="lazy"
      />
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className="relative z-10 h-full w-full object-contain drop-shadow-md"
        loading="lazy"
      />
    </div>
  );
}
