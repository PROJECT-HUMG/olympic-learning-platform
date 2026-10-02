import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHomeMotion } from "../hooks/use-home-motion";

export function HomeMotionToggle() {
  const { enabled, reduced, setEnabled } = useHomeMotion();
  const label = reduced ? "Nền động (tắt theo chế độ giảm chuyển động)" : "Nền động";
  return (
    <Button type="button" variant="ghost" size="icon" className="home-motion-toggle rounded-full"
      aria-label={label} aria-pressed={enabled} disabled={reduced}
      title={reduced ? "Thiết bị đang giảm chuyển động" : enabled ? "Tắt nền động" : "Bật nền động"}
      onClick={() => setEnabled(!enabled)}>
      <Sparkles aria-hidden="true" className="size-4" />
    </Button>
  );
}
