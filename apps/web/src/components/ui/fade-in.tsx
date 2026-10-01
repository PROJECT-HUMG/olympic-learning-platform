import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.7,
}: FadeInProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const directionOffsets = {
    up: 40,
    down: -40,
    left: 40,
    right: -40,
  };

  const axis = direction === "up" || direction === "down" ? "y" : "x";

  return (
    <motion.div
      initial={reducedMotion ? false : {
        opacity: 0,
        [axis]: directionOffsets[direction],
      }}
      animate={reducedMotion ? { opacity: 1, [axis]: 0 } : undefined}
      whileInView={{
        opacity: 1,
        [axis]: 0,
      }}
      viewport={{ once: true, margin: "0px 0px -48px 0px" }}
      transition={{
        duration: reducedMotion ? 0 : duration,
        delay: reducedMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn("focus-within:opacity-100! focus-within:transform-none! motion-reduce:opacity-100! motion-reduce:transform-none!", className)}
    >
      {children}
    </motion.div>
  );
}
