"use client";

/** Kokonut Liquid Glass Card / Now Playing2.0.0, MIT @dorianbaffier.
 * Original SVG refraction, bevel and disc/tonearm geometry. No demo clock,
 * fake waveform/artwork or synthetic playback engine. The disc follows YT state.
 */
import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const GLASS_SHADOW_LIGHT =
  "shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)]";

const GLASS_SHADOW_DARK =
  "dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]";

const GLASS_SHADOW = `${GLASS_SHADOW_LIGHT} ${GLASS_SHADOW_DARK}`;

const DEFAULT_GLASS_FILTER_SCALE = 30;

interface GlassFilterProps {
  id: string;
  scale?: number;
}

const GlassFilter = React.memo(
  ({ id, scale = DEFAULT_GLASS_FILTER_SCALE }: GlassFilterProps) => (
    <svg aria-hidden="true" className="pointer-events-none absolute size-0" focusable={false}>
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          height="200%"
          id={id}
          width="200%"
          x="-50%"
          y="-50%"
        >
          <feTurbulence
            baseFrequency="0.05 0.05"
            numOctaves="1"
            result="turbulence"
            seed="1"
            type="fractalNoise"
          />
          <feGaussianBlur
            in="turbulence"
            result="blurredNoise"
            stdDeviation="2"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            result="displaced"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="B"
          />
          <feGaussianBlur in="displaced" stdDeviation="4" />
        </filter>
      </defs>
    </svg>
  )
);
GlassFilter.displayName = "GlassFilter";


export function LiquidGlassCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const filterId = React.useId();
  return <Card data-kokonut-glass className={cn("room-glass-card relative overflow-hidden", className)} {...props}>
    <div aria-hidden="true" className={cn("room-glass-bevel pointer-events-none absolute inset-0 rounded-[inherit]", GLASS_SHADOW)} />
    <div aria-hidden="true" className="room-glass-refraction pointer-events-none absolute inset-0 rounded-[inherit]" style={{ backdropFilter: `url("#${filterId}")` }} />
    <GlassFilter id={filterId} />
    <div className="relative min-w-0">{children}</div>
  </Card>;
}

const GROOVES = [28, 31, 34, 37, 40, 43, 46];

function Disc() {
  const clipId = React.useId();
  return <svg aria-hidden="true" className="size-full" viewBox="0 0 100 100">
    <circle className="fill-zinc-900 dark:fill-black" cx="50" cy="50" r="50" />
    {GROOVES.map(r => <circle key={r} className="fill-none stroke-white/[0.08]" cx="50" cy="50" r={r} strokeWidth=".6" />)}
    <circle className="fill-none stroke-white/[0.16]" cx="50" cy="50" r="49" strokeWidth=".8" />
    <circle className="fill-primary" cx="50" cy="50" r="24" />
    <clipPath id={clipId}><circle cx="50" cy="50" r="24" /></clipPath>
    {/* Source LabelArt's generic geometry; decorative, never claimed as album art. */}
    <g clipPath={`url(#${clipId})`} transform="translate(26 26) scale(0.48)" className="fill-primary-foreground">
      <circle cx="64" cy="36" r="20" />
      <rect height="5" width="64" x="18" y="60" /><rect height="5" width="52" x="18" y="70" /><rect height="5" width="40" x="18" y="80" />
    </g>
    <circle className="fill-primary-foreground" cx="50" cy="50" r="1.8" />
  </svg>;
}

function Tonearm({ down }: { down: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -top-1 -right-4 h-[80%] w-auto origin-[77.5%_10%] transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none"
      style={{ transform: down ? "rotate(11deg)" : "rotate(-8deg)" }}
      viewBox="0 0 40 110"
    >
      <circle
        className="fill-zinc-200 stroke-zinc-300 dark:fill-zinc-700 dark:stroke-zinc-600"
        cx="31"
        cy="11"
        r="8"
      />
      <circle className="fill-zinc-400" cx="31" cy="11" r="3" />
      <path
        className="fill-none stroke-zinc-400 dark:stroke-zinc-500"
        d="M31 11 L31 70 L18 92"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <rect
        className="fill-zinc-600 dark:fill-zinc-300"
        height="12"
        rx="1.5"
        transform="rotate(32 16 96)"
        width="7"
        x="12.5"
        y="90"
      />
    </svg>
  );
}


/** Decorative record, never an unconnected scrub/play control. */
export function NowPlayingDisc({ playing }: { playing: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    const sync = () => { node.dataset.moving = String(playing && visible && !document.hidden && !media.matches); };
    const observer = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; sync(); });
    observer.observe(node); media.addEventListener("change", sync); document.addEventListener("visibilitychange", sync); sync();
    return () => { observer.disconnect(); media.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); node.dataset.moving = "false"; };
  }, [playing]);
  return <div className="room-record" data-playing={playing} aria-hidden="true">
    <div className="room-record-disc" ref={ref}><Disc /></div><Tonearm down={playing} />
  </div>;
}
