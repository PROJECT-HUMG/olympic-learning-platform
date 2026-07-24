import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  duration = 0.5,
}: FadeInProps) {
  const directionOffsets = {
    up: 40,
    down: -40,
    left: 40,
    right: -40,
  };

  const axis = direction === "up" || direction === "down" ? "y" : "x";

  return (
    <motion.div
      initial={{
        opacity: 0,
        [axis]: directionOffsets[direction],
      }}
      whileInView={{
        opacity: 1,
        [axis]: 0,
      }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: duration,
        delay: delay,
        ease: "easeOut",
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
