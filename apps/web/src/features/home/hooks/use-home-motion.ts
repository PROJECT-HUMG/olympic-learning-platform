import { useMediaQuery } from "@/hooks/use-media-query";

export function useHomeMotion() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  return { enabled: !reducedMotion };
}
