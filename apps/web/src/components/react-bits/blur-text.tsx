'use client';

// Adapted from @react-bits/BlurText-TS-TW, retrieved through shadcn MCP.
// Local fit: installed Framer Motion, phrasing/semantic text, readable defaults,
// static reduced-motion output, one reveal per mount and natural word spacing.
import { motion, useReducedMotion, type Transition, type Easing } from 'framer-motion';
import { Fragment, useEffect, useRef, useState, useMemo } from 'react';

type BlurTextProps = {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Record<string, string | number>;
  animationTo?: Array<Record<string, string | number>>;
  easing?: Easing | Easing[];
  onAnimationComplete?: () => void;
  stepDuration?: number;
};

const DEFAULT_EASING: Easing = [0.22, 1, 0.36, 1];

const buildKeyframes = (
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>,
): Record<string, Array<string | number>> => {
  const keys = new Set([...Object.keys(from), ...steps.flatMap(step => Object.keys(step))]);
  const keyframes: Record<string, Array<string | number>> = {};
  keys.forEach(key => { keyframes[key] = [from[key], ...steps.map(step => step[key])]; });
  return keyframes;
};

export default function BlurText({
  text,
  delay = 24,
  className = '',
  animateBy = 'words',
  direction = 'bottom',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = DEFAULT_EASING,
  onAnimationComplete,
  stepDuration = 0.28,
}: BlurTextProps) {
  const reducedMotion = useReducedMotion();
  const enabled = reducedMotion === false;
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    if (!('IntersectionObserver' in window)) { setInView(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold, rootMargin });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [enabled, threshold, rootMargin]);

  const defaultFrom = useMemo(() => ({
    filter: 'blur(2px)', opacity: 0.65, y: direction === 'top' ? -6 : 6,
  }), [direction]);
  const defaultTo = useMemo(() => [{ filter: 'blur(0px)', opacity: 1, y: 0 }], []);
  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;
  const keyframes = useMemo(() => buildKeyframes(fromSnapshot, toSnapshots), [fromSnapshot, toSnapshots]);
  const elements = useMemo(() => animateBy === 'words' ? text.split(' ') : Array.from(text), [text, animateBy]);
  const stepCount = toSnapshots.length + 1;
  const times = Array.from({ length: stepCount }, (_, i) => stepCount === 1 ? 0 : i / (stepCount - 1));

  // A span is valid inside a real h1. Reduced motion has no hidden/animated copy.
  if (!enabled) return <span ref={ref} className={`blur-text ${className}`}>{text}</span>;

  return <span ref={ref} className={`blur-text ${className}`}>
    <span className="sr-only select-none">{text}</span>
    <span aria-hidden="true">
      {elements.map((segment, index) => {
        const transition: Transition = {
          duration: stepDuration * (stepCount - 1), times,
          delay: index * delay / 1000, ease: easing,
        };
        return <Fragment key={index}>
          <motion.span
            initial={fromSnapshot}
            animate={inView ? keyframes : fromSnapshot}
            transition={transition}
            onAnimationComplete={inView && index === elements.length - 1 ? onAnimationComplete : undefined}
            style={{ display: 'inline-block', maxWidth: '100%', overflowWrap: 'anywhere' }}
          >{segment === ' ' ? '\u00a0' : segment}</motion.span>
          {animateBy === 'words' && index < elements.length - 1 && ' '}
        </Fragment>;
      })}
    </span>
  </span>;
}
