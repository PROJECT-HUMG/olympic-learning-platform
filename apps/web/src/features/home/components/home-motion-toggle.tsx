import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHomeMotion } from "../hooks/use-home-motion";

export function HomeMotionToggle() {
  const { enabled, setEnabled } = useHomeMotion();
  return (
    <Button type="button" variant="ghost" size="icon" className="home-motion-toggle rounded-full"
      aria-label="Nền động" aria-pressed={enabled}
      title={enabled ? "Tắt nền động" : "Bật nền động"}
      onClick={() => setEnabled(!enabled)}>
      <Sparkles aria-hidden="true" className="size-4" />
    </Button>
  );
}
