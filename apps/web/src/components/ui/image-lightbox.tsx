import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  withBlurFill?: boolean;
}

export function ImageLightbox({
  src,
  alt = "",
  className,
  containerClassName,
  withBlurFill = true,
}: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent scroll
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const openLightbox = () => setIsOpen(true);
  const closeLightbox = () => setIsOpen(false);

  const lightboxContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-8 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 right-4 z-[110] p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
            aria-label="Đóng"
          >
            <X className="h-6 w-6" />
          </button>

          <motion.img
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div
        className={cn(
          "relative group cursor-zoom-in overflow-hidden",
          containerClassName
        )}
        onClick={openLightbox}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && openLightbox()}
      >
        {withBlurFill && (
          <div className="absolute inset-0 overflow-hidden bg-muted rounded-[inherit]">
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover blur-xl scale-110 opacity-60 dark:opacity-40"
              aria-hidden="true"
              loading="lazy"
            />
          </div>
        )}

        <img
          src={src}
          alt={alt}
          className={cn(
            "relative z-10 w-full",
            withBlurFill ? "h-full object-contain drop-shadow-md" : "h-auto object-cover",
            className
          )}
          loading="lazy"
        />

        {/* Hover overlay indicator */}
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 opacity-0 group-hover:bg-black/10 group-hover:opacity-100 transition-all rounded-[inherit]">
          <div className="bg-background/80 backdrop-blur-sm text-foreground p-2 rounded-full shadow-sm transform scale-90 group-hover:scale-100 transition-transform">
            <ZoomIn className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Render portal only on client to avoid hydration mismatch */}
      {mounted && createPortal(lightboxContent, document.body)}
    </>
  );
}
