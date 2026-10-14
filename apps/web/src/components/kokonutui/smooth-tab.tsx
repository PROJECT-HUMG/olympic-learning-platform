"use client";

/**
 * @author: @dorianbaffier
 * @description: Smooth Tab
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

// Adapted from @kokonutui/smooth-tab, retrieved through shadcn MCP.
// Keep its measured sliding indicator; existing Radix owns selection, panels,
// roving focus and keys. No demo items, fixed-height cards or panel entrances.
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import "./smooth-tab.css";

interface SmoothTabProps {
  value: string;
  items: { value: string; label: string; icon: ReactNode }[];
  label: string;
  className?: string;
}

export default function SmoothTab({ value, items, label, className }: SmoothTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const button = container.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      if (!button) { setIndicator(null); return; }
      const next = { x: button.offsetLeft, y: button.offsetTop, width: button.offsetWidth, height: button.offsetHeight };
      setIndicator(previous => previous && Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    container.querySelectorAll('[role="tab"]').forEach(tab => observer.observe(tab));
    return () => observer.disconnect();
  }, [value]);

  return (
    <TabsList ref={containerRef} data-smooth-tabs="" className={cn("kokonut-smooth-tab", className)} aria-label={label}>
      {indicator && <motion.span
        data-smooth-indicator="" aria-hidden="true" className="kokonut-smooth-tab__indicator"
        initial={false} animate={indicator}
        transition={{ duration: reduceMotion === false ? 0.18 : 0, ease: [0.32, 0.72, 0, 1] }}
      />}
      {items.map(item => <TabsTrigger key={item.value} value={item.value}>
        {item.icon}<span>{item.label}</span>
      </TabsTrigger>)}
    </TabsList>
  );
}
