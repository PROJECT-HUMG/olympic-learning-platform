// Adapted from free React Bits DepthCarousel-TS-CSS (MCP registry source).
// Retains its perspective rail, depth/falloff geometry and horizontal drag;
// controlled rendering keeps private media fetching in the feature owner.
import { useRef, type ReactNode, type PointerEvent } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import "./depth-carousel.css";

gsap.registerPlugin(useGSAP);
export interface DepthCarouselItem { id: string; name: string }
export function DepthCarousel<T extends DepthCarouselItem>({ items, selectedId, onSelect, renderItem, label, controls = true, preloadNeighbors = false }: {
  items: T[]; selectedId: string | null; onSelect: (id: string) => void;
  renderItem: (item: T) => ReactNode; label: string; controls?: boolean; preloadNeighbors?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const previous = useRef(Math.max(0, items.findIndex(item => item.id === selectedId)));
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const index = Math.max(0, items.findIndex(item => item.id === selectedId));
  const move = (next: number) => { if (items.length) onSelect(items[Math.max(0, Math.min(next, items.length - 1))].id); };
  useGSAP(() => {
    const position = { value: previous.current };
    previous.current = index;
    const cards = Array.from(root.current?.querySelectorAll<HTMLElement>(".depth-carousel__card") ?? []);
    const layout = () => cards.forEach((card, i) => {
      const d = i - position.value;
      const back = Math.max(0, d);
      // The upstream geometry, with narrower spread and contain-fit media for reading.
      card.style.transform = `translate(-50%, -50%) translateX(${42 * d}px) translateZ(${-130 * Math.abs(d)}px) rotateY(${12 * Math.max(-1, Math.min(1, d))}deg)`;
      card.style.opacity = Math.abs(d) > 2 ? "0" : String(Math.max(.14, 1 - Math.abs(d) * .35));
      card.style.filter = `brightness(${Math.max(.5, 1 - back * .18)})`;
      card.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
    });
    if (reduced || position.value === index) { position.value = index; layout(); return; }
    gsap.to(position, { value: index, duration: .42, ease: "power3.out", onUpdate: layout });
  }, { scope: root, dependencies: [index, items.length, reduced], revertOnUpdate: true });
  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("button,a,input")) return;
    drag.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current; drag.current = null;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x, dy = event.clientY - current.y;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) move(index + (dx < 0 ? 1 : -1));
  }
  return <div ref={root} className="depth-carousel" role="region" aria-roledescription="bộ ảnh" aria-label={label}>
    <div className="depth-carousel__stage" tabIndex={items.length > 1 ? 0 : undefined}
      aria-label="Ảnh; dùng phím trái hoặc phải để chuyển" onPointerDown={start} onPointerUp={end} onPointerCancel={() => { drag.current = null; }}
      onKeyDown={event => { if (event.target !== event.currentTarget) return; const next = event.key === "ArrowLeft" ? index - 1 : event.key === "ArrowRight" ? index + 1 : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null; if (next !== null) { event.preventDefault(); move(next); } }}>
      {items.map((item, i) => <div key={item.id} className="depth-carousel__card" aria-hidden={i !== index} inert={i !== index}>
        {i === index || (preloadNeighbors && Math.abs(i - index) <= 2) ? renderItem(item) : <span className="depth-carousel__back" aria-hidden="true" />}
      </div>)}
    </div>
    {controls && <div className="depth-carousel__controls">
      <Button type="button" variant="outline" size="icon" disabled={!index} onClick={() => move(index - 1)} aria-label="Ảnh trước"><ChevronLeft aria-hidden="true" size={18} /></Button>
      <p role="status">{items.length ? `${index + 1} / ${items.length}` : "Chưa có ảnh"}</p>
      <Button type="button" variant="outline" size="icon" disabled={index >= items.length - 1} onClick={() => move(index + 1)} aria-label="Ảnh sau"><ChevronRight aria-hidden="true" size={18} /></Button>
    </div>}
  </div>;
}
