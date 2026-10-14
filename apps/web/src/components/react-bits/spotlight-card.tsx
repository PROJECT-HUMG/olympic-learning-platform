// Adapted from @react-bits/SpotlightCard-TS-TW via shadcn MCP.
// Narrowed to two real navigation rows: pointer/focus light only. Omit the
// registry's ambient/proximity/grain/flare engine and global animation loop.
import { type PointerEvent, type ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";
import "./spotlight-card.css";

export default function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const root = rootRef.current;
    if (!root) return;
    root.dataset.hovered = "true";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = root.getBoundingClientRect();
    root.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
    root.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
  };
  return <div ref={rootRef} className={cn("rb-spotlight-card", className)}
    onPointerEnter={move} onPointerMove={move}
    onPointerLeave={() => { if (rootRef.current) delete rootRef.current.dataset.hovered; }}>
    <span className="rb-spotlight-card__light" aria-hidden="true" />
    {children}
  </div>;
}
