import { useHomeMotionStore } from "@/stores/use-home-motion-store";

export function useHomeMotion() {
  const preference = useHomeMotionStore((state) => state.enabled);
  const setEnabled = useHomeMotionStore((state) => state.setEnabled);
  return { enabled: preference ?? true, setEnabled };
}
