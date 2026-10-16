// Adapted from official @kokonutui/liquid-glass-card 2.0.0 (MIT, @dorianbaffier).
// Reuse its opt-in glass Card primitive, not the demo's synthetic track clock/disc engine.
import type { HTMLAttributes } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LiquidGlassCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Card className={cn("room-glass-card relative overflow-hidden", className)} {...props}>
    <div aria-hidden="true" className="room-glass-card__highlight pointer-events-none absolute inset-0 rounded-[inherit]" />
    <div className="relative min-w-0">{children}</div>
  </Card>;
}
