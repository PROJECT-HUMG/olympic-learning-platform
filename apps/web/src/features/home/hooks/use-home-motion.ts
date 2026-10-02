import { useMediaQuery } from "@/hooks/use-media-query";
import { useHomeMotionStore } from "@/stores/use-home-motion-store";

export function useHomeMotion() {
  const preference = useHomeMotionStore((state) => state.enabled);
  const setEnabled = useHomeMotionStore((state) => state.setEnabled);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  return { enabled: !reduced && (preference ?? true), reduced, setEnabled };
}
