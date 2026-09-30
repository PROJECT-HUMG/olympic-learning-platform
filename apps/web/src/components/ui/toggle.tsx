import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useSpring, useTransform, useVelocity } from "framer-motion";
import { cn } from "@/lib/utils";
import "./toggle.css";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const TRACK = 92;
const THUMB = 36;
const PAD = (46 - THUMB) / 2;

const SHUT_X = PAD;
const OPEN_X = TRACK - THUMB - PAD;
const MID_X = (SHUT_X + OPEN_X) / 2;

export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  stretch?: number;
  speed?: number;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}

export function LiquidGooFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }} aria-hidden="true">
      <defs>
        <filter id="liq-goo" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={7} result="smear" />
          <feColorMatrix
            in="smear"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
          />
        </filter>
      </defs>
    </svg>
  );
}

export function Toggle({
  checked,
  defaultChecked = false,
  onCheckedChange,
  stretch = 36,
  speed = 50,
  scale = 1,
  className,
  style,
  disabled = false,
  id,
  "aria-label": ariaLabel = "Liquid toggle",
}: ToggleProps = {}) {
  const isControlled = checked !== undefined;
  const [internalOn, setInternalOn] = useState(defaultChecked);
  const on = isControlled ? checked : internalOn;

  const [held, setHeld] = useState(false);
  const [hot, setHot] = useState(false);
  const rail = useRef<HTMLButtonElement | null>(null);
  const grip = useRef<{ id: number; grab: number | null; moved: boolean } | null>(null);

  const initialX = (isControlled ? checked : defaultChecked) ? OPEN_X : SHUT_X;
  const x = useMotionValue<number>(initialX);

  const vel = useVelocity(x);
  const eased = useSpring(vel, { stiffness: 320, damping: 40, mass: 0.6 });
  const lengthen = (v: number) =>
    1 + Math.min(0.4, Math.abs(v) / 600) * (clamp(stretch, 0, 100) / 100);

  const swell = useSpring(hot ? 1.035 : 1, {
    stiffness: 520,
    damping: 34,
    mass: 0.6,
  });
  const wide = useTransform([eased, swell], ([v, s]: number[]) => lengthen(v) * s);
  const tall = useTransform([eased, swell], ([v, s]: number[]) => s / lengthen(v));

  const settle = useMemo(
    () => ({
      type: "spring" as const,
      stiffness: 170 - (50 - speed) * 1.1,
      damping: 21.5,
      mass: 0.9,
    }),
    [speed],
  );

  // Sync external checked changes to motion value when not held
  useEffect(() => {
    if (held) return;
    const run = animate(x, on ? OPEN_X : SHUT_X, settle);
    return () => run.stop();
  }, [on, held, x, settle]);

  const updateState = (nextOn: boolean) => {
    if (disabled) return;
    if (!isControlled) {
      setInternalOn(nextOn);
    }
    onCheckedChange?.(nextOn);
  };

  const local = (clientX: number) => {
    const el = rail.current;
    if (!el) return 0;
    const b = el.getBoundingClientRect();
    const k = b.width / (el.offsetWidth || b.width) || 1;
    return (clientX - b.left) / k;
  };

  const down = (e: React.PointerEvent) => {
    if (disabled) return;
    grip.current = { id: e.pointerId, grab: null, moved: false };
    setHeld(true);
    try {
      rail.current?.setPointerCapture(e.pointerId);
    } catch {
      /* not live */
    }
  };

  const move = (e: React.PointerEvent) => {
    if (disabled) return;
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    const at = local(e.clientX);
    if (g.grab === null) g.grab = at - x.get();
    const next = clamp(at - g.grab, SHUT_X, OPEN_X);
    if (Math.abs(next - x.get()) > 0.4) g.moved = true;
    x.set(next);
    const past = next > MID_X;
    if (past !== on) {
      updateState(past);
    }
  };

  const up = (e: React.PointerEvent) => {
    if (disabled) return;
    const g = grip.current;
    if (!g) return;
    grip.current = null;
    try {
      rail.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* never captured */
    }
    if (!g.moved) {
      updateState(!on);
    }
    setHeld(false);
  };

  return (
    <>
      <LiquidGooFilter />
      <div
        className={cn("liq-well", className)}
        style={
          {
            "--liq-thumb": `${THUMB}px`,
            ...(scale !== 1
              ? {
                  width: `${Math.round(TRACK * scale)}px`,
                  height: `${Math.round(46 * scale)}px`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }
              : {}),
            ...style,
          } as React.CSSProperties
        }
      >
        <button
          id={id}
          ref={rail}
          className="liq-sw"
          data-on={on}
          role="switch"
          disabled={disabled}
          aria-checked={on}
          aria-label={ariaLabel}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerEnter={() => setHot(true)}
          onPointerLeave={() => setHot(false)}
          onKeyDown={(e) => {
            if (e.key !== " " && e.key !== "Enter") return;
            e.preventDefault();
            updateState(!on);
          }}
          style={
            scale !== 1
              ? {
                  transform: `scale(${scale})`,
                  transformOrigin: "center",
                  flexShrink: 0,
                }
              : undefined
          }
        >
          <span className="liq-sw-blobs" aria-hidden="true">
            <motion.span className="liq-thumb" style={{ x, scaleX: wide, scaleY: tall }} />
          </span>
        </button>
      </div>
    </>
  );
}
