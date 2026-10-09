import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  withBlurFill?: boolean;
}

export function ImageLightbox({ src, alt = "", className, containerClassName, withBlurFill = true }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button type="button" aria-label={alt ? `Phóng to ảnh: ${alt}` : "Phóng to ảnh"}
          className={cn("group relative block w-full cursor-zoom-in overflow-hidden rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", containerClassName)}>
          {withBlurFill && <span className="absolute inset-0 overflow-hidden rounded-[inherit] bg-muted" aria-hidden="true">
            <img src={src} alt="" className="h-full w-full scale-110 object-cover opacity-60 blur-xl dark:opacity-40" loading="lazy" />
          </span>}
          <img src={src} alt={alt} className={cn("relative z-10 w-full", withBlurFill ? "h-full object-contain drop-shadow-md" : "h-auto object-cover", className)} loading="lazy" />
          <span aria-hidden="true" className="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-black/0 opacity-0 transition-[background-color,opacity] group-hover:bg-black/10 group-hover:opacity-100 group-focus-visible:opacity-100">
            <span className="rounded-full bg-background/80 p-2 text-foreground shadow-sm backdrop-blur-md"><ZoomIn className="size-5" /></span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}
        className="flex h-dvh max-h-none w-screen max-w-none items-center justify-center gap-0 rounded-none bg-black/95 p-4 text-white ring-0 sm:max-w-none sm:p-8"
        onClick={event => { if (event.target === event.currentTarget) setIsOpen(false); }}>
        <DialogTitle className="sr-only">{alt || "Xem ảnh"}</DialogTitle>
        <DialogDescription className="sr-only">Ảnh phóng to. Nhấn Escape hoặc Đóng ảnh để quay lại bài viết.</DialogDescription>
        <DialogClose asChild>
          <Button type="button" variant="ghost" size="icon" aria-label="Đóng ảnh" className="absolute right-4 top-4 z-10 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white focus-visible:ring-white">
            <X aria-hidden="true" />
          </Button>
        </DialogClose>
        <img src={src} alt={alt} className="max-h-[calc(100dvh-4rem)] max-w-full rounded-md object-contain shadow-2xl" />
      </DialogContent>
    </Dialog>
  );
}
