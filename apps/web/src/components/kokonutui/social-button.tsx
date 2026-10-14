"use client";

/**
 * @author: @dorianbaffier
 * @description: Social Button
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

// Adapted from @kokonutui/social-button via shadcn MCP. Real actions are
// required; installed Framer Motion and HUMG tokens replace registry defaults.
import { Share2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ShareItem = {
  icon: ReactNode;
  label: string;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

interface SocialButtonProps {
  label?: string;
  items: ShareItem[];
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const HOVER_INTENT_MS = 100;

export default function SocialButton({ label = "Chia sẻ bài viết", items }: SocialButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isVisible = isHovered || isOpen;
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  const clearHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };

  const close = () => { clearHover(); setIsOpen(false); setIsHovered(false); };
  const openAndFocus = () => {
    clearHover();
    flushSync(() => setIsOpen(true));
    rowRef.current?.querySelector<HTMLElement>("a,button")?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        setIsOpen(false);
        setIsHovered(false);
      }
    };
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="article-share-control relative inline-grid max-w-full grid-cols-1 align-middle"
      style={{ width: Math.max(176, items.length * 48) }}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        clearHover();
        hoverTimer.current = setTimeout(() => {
          // Do not make a focused trigger inert without transferring its focus.
          if (document.activeElement === triggerRef.current) openAndFocus();
          else setIsHovered(true);
        }, HOVER_INTENT_MS);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        clearHover();
        // Keep keyboard focus visible even if the pointer leaves the strip.
        if (rowRef.current?.contains(document.activeElement)) setIsOpen(true);
        setIsHovered(false);
      }}
      onBlur={(event) => { if (!rootRef.current?.contains(event.relatedTarget)) close(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isVisible) {
          event.preventDefault();
          event.stopPropagation();
          flushSync(close);
          triggerRef.current?.focus({ preventScroll: true });
        }
      }}
    >
      <motion.div
        className="col-start-1 row-start-1 self-stretch"
        animate={{ opacity: isVisible ? 0 : 1 }} initial={false}
        transition={{ duration: reduceMotion ? 0 : 0.15, ease: EASE_OUT }}
        aria-hidden={isVisible}
        inert={isVisible}
      >
        <Button
          type="button" variant="outline" ref={triggerRef}
          className="h-full min-h-11 w-full"
          aria-expanded={isVisible} aria-controls={id}
          onClick={openAndFocus}
        ><Share2 aria-hidden="true" />{label}</Button>
      </motion.div>
      {/* In-flow grid reserves the action footprint, including a wrapped row in
          a constrained container. Hidden actions are inert and cannot block clicks. */}
      <div
        id={id} ref={rowRef} role="group" aria-label={label}
        aria-hidden={!isVisible} inert={!isVisible}
        className={cn("col-start-1 row-start-1 flex flex-wrap overflow-hidden rounded-md border border-border bg-card", !isVisible && "invisible pointer-events-none")}
      >
        {items.map((item, index) => {
          const actionProps = {
            initial: false as const,
            animate: { opacity: isVisible ? 1 : 0, x: isVisible || reduceMotion ? 0 : -4 },
            transition: { duration: reduceMotion ? 0 : 0.16, ease: EASE_OUT, delay: isVisible && !reduceMotion ? index * 0.02 : 0 },
            className: "flex min-h-11 min-w-11 flex-1 items-center justify-center border-r border-border text-muted-foreground last:border-r-0 hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
            "aria-label": item.label,
            title: item.label,
            onClick: item.onClick,
          };
          return item.href ? (
            <motion.a key={item.label} {...actionProps} href={item.href} target="_blank" rel="noopener noreferrer">{item.icon}</motion.a>
          ) : (
            <motion.button key={item.label} {...actionProps} type="button">{item.icon}</motion.button>
          );
        })}
      </div>
    </div>
  );
}
