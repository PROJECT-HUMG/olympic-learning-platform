// Adapted from free React Bits SwipeToast-TS-CSS (MCP registry source).
// Sonner's store remains the sole public toast API; this owner handles presentation/lifetime.
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import "./swipe-toast.css";

export type SwipeToastCloseReason = "timeout" | "swipe" | "close" | "escape";
interface Props extends Omit<HTMLAttributes<HTMLLIElement>, "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"> {
  children: ReactNode;
  duration: number;
  restartKey: unknown;
  dismissible: boolean;
  onClose: (reason: SwipeToastCloseReason) => void;
}
type Sample = [number, number];
const rubberband = (over: number, dim = 24, c = .55) => over * dim * c / (dim + c * Math.abs(over));
const velocityOf = (hist: Sample[]) => {
  if (hist.length < 2) return 0;
  const [t0, y0] = hist[0], [t1, y1] = hist[hist.length - 1];
  return performance.now() - t1 > 100 ? 0 : (y1 - y0) / Math.max(1, t1 - t0);
};

export function SwipeToast({ children, duration, restartKey, dismissible, onClose, className = "", ...props }: Props) {
  const reduce = useReducedMotion();
  const y = useMotionValue(0);
  const fade = useMotionValue(1);
  const card = useRef<HTMLLIElement>(null), fuse = useRef<HTMLElement>(null);
  const controls = useRef<ReturnType<typeof animate> | null>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  const closing = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(true);
  const drag = useRef<{ id: number; startY: number; grab: number | null; hist: Sample[] } | null>(null);
  const [hover, setHover] = useState(false), [focus, setFocus] = useState(false), [interacting, setInteracting] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const paused = hover || focus || interacting || hidden;
  const clock = useRef({ remaining: duration, started: 0 });
  const burn = useRef<Animation | null>(null);
  const finite = Number.isFinite(duration) && duration > 0;

  useEffect(() => {
    mounted.current = true;
    const visibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => { mounted.current = false; document.removeEventListener("visibilitychange", visibility); controls.current?.stop(); y.stop(); fade.stop(); };
  }, [y, fade]);
  useEffect(() => {
    // A new payload/status starts its new duration. Pause/resume and motion preference keep the remainder.
    generation.current++; closing.current = false;
    controls.current?.stop(); y.stop(); fade.stop(); y.set(0); fade.set(1);
    clock.current.remaining = duration;
  }, [duration, restartKey, y, fade]);
  useEffect(() => {
    burn.current?.cancel();
    if (finite && !reduce && fuse.current && typeof fuse.current.animate === "function") {
      burn.current = fuse.current.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: clock.current.remaining, easing: "linear", fill: "forwards" });
      burn.current.pause();
    } else burn.current = null;
    return () => { burn.current?.cancel(); };
  }, [duration, finite, reduce, restartKey]);
  useEffect(() => {
    if (!finite || paused) { burn.current?.pause(); return; }
    const state = clock.current;
    state.started = performance.now();
    burn.current?.play();
    const timer = window.setTimeout(() => {
      if (!closing.current) { closing.current = true; closeRef.current("timeout"); }
    }, Math.max(0, state.remaining));
    return () => {
      clearTimeout(timer); burn.current?.pause();
      state.remaining = Math.max(0, state.remaining - (performance.now() - state.started)); state.started = 0;
    };
  }, [duration, finite, paused, reduce, restartKey]);

  const finishDrag = (event: React.PointerEvent<HTMLLIElement>, cancelled = false) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null; setInteracting(false);
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* Capture can already be released. */ }
    const dy = reduce ? d.hist[d.hist.length - 1][1] : y.get(), velocity = velocityOf(d.hist);
    if (!cancelled && dy > 0 && (velocity > .11 || (dy >= 40 && velocity >= 0))) {
      closing.current = true;
      if (reduce) { y.set(0); closeRef.current("swipe"); return; }
      controls.current = animate(y, dy + (card.current?.offsetHeight || 80), { type: "spring", duration: .3, bounce: 0, velocity: velocity * 1000 });
      const swipeGeneration = generation.current;
      void animate(fade, 0, { duration: .2 }).then(() => { if (mounted.current && generation.current === swipeGeneration) closeRef.current("swipe"); });
    } else if (reduce) y.set(0);
    else controls.current = animate(y, 0, { type: "spring", duration: .4, bounce: .15, velocity: velocity * 1000 });
  };

  return <motion.li {...props} ref={card} className={`swipe-toast__card ${className}`} style={{ ...props.style, y, opacity: fade }}
    initial={reduce ? false : { opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, translateY: 12 }} transition={{ duration: reduce ? 0 : .18 }}
    data-dismissible={dismissible} data-swiping={interacting || undefined}
    onPointerDown={event => {
      const scrolling = (event.target as HTMLElement).closest<HTMLElement>("[data-content]");
      if (scrolling && scrolling.scrollHeight > scrolling.clientHeight) return;
      if (event.button !== 0 || !dismissible || closing.current || drag.current || (event.target as HTMLElement).closest("button,a,input,select,textarea,[role=button]")) return;
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Optional capture on older engines. */ }
      controls.current?.stop(); y.stop();
      drag.current = { id: event.pointerId, startY: event.clientY, grab: null, hist: [[performance.now(), y.get()]] }; setInteracting(true);
    }}
    onPointerMove={event => {
      const d = drag.current; if (!d || d.id !== event.pointerId) return;
      if (d.grab === null) { if (Math.abs(event.clientY - d.startY) < 3) return; d.grab = event.clientY - y.get(); }
      const raw = event.clientY - d.grab, next = raw >= 0 ? raw : rubberband(raw);
      y.set(reduce ? 0 : next); d.hist.push([performance.now(), next]); if (d.hist.length > 4) d.hist.shift();
      // Keep logical displacement even in reduced mode, without moving the content.
      if (reduce) d.hist[d.hist.length - 1][1] = raw;
    }}
    onPointerUp={event => finishDrag(event)} onPointerCancel={event => finishDrag(event, true)}
    onPointerEnter={event => { if (event.pointerType === "mouse") setHover(true); }} onPointerLeave={event => { if (event.pointerType === "mouse") setHover(false); }}
    onFocus={() => setFocus(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocus(false); }}
    onKeyDown={event => { props.onKeyDown?.(event); if (event.key === "Escape" && dismissible) { event.stopPropagation(); closing.current = true; closeRef.current("escape"); } }}>
    {children}
    {finite && <i ref={fuse} className="swipe-toast__fuse" aria-hidden="true" />}
  </motion.li>;
}
