import { motion, useScroll, useSpring } from "framer-motion";
import type { RefObject } from "react";

interface ReadingProgressBarProps {
  targetRef: RefObject<HTMLElement | null>;
}

export function ReadingProgressBar({ targetRef }: ReadingProgressBarProps) {
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 h-0.5 origin-left bg-primary"
      style={{ scaleX }}
    />
  );
}
