// Adapted from free React Bits MaskedHeading-TS-CSS, retrieved through shadcn MCP.
// Preserve the measured SVG word masks, media fill and staggered reveal. Native
// text owns responsive typography, the accessible name and unsupported fallback.
import { Fragment, useId, useMemo, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useMediaQuery } from "@/hooks/use-media-query";
import "./masked-heading.css";

gsap.registerPlugin(useGSAP);

export default function MaskedHeading({ text }: { text: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const measure = useRef<HTMLSpanElement>(null);
  const media = useRef<HTMLSpanElement>(null);
  const lines = useMemo(() => text.split("\n").map(line => line.split(/\s+/).filter(Boolean)), [text]);
  const words = useMemo(() => lines.flat(), [lines]);
  const clipId = `mh-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const revealed = useRef(false);

  useGSAP((_, contextSafe) => {
    const host = root.current, native = measure.current, fill = media.current;
    if (reduced || !contextSafe || !host || !native || !fill ||
      !CSS.supports("clip-path", 'url("#mask")') ||
      !("ResizeObserver" in window) || !("IntersectionObserver" in window)) return;
    const boxes = [...native.querySelectorAll<HTMLSpanElement>(".masked-heading__word")];
    const glyphs = [...host.querySelectorAll<SVGTextElement>("text")];
    let disposed = false, inView = false, ready = false;
    let entrance: gsap.core.Tween | undefined;
    let drift: gsap.core.Tween | undefined;

    const sync = () => {
      if (disposed) return;
      const cs = getComputedStyle(native);
      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i], base = box.querySelector<HTMLElement>("i"), glyph = glyphs[i];
        if (!base || !glyph) return;
        glyph.setAttribute("x", String(box.offsetLeft));
        glyph.setAttribute("y", String(base.offsetTop));
        glyph.style.fontFamily = cs.fontFamily;
        glyph.style.fontSize = cs.fontSize;
        glyph.style.fontWeight = cs.fontWeight;
        glyph.style.fontStyle = cs.fontStyle;
        glyph.style.letterSpacing = cs.letterSpacing;
      }
      // A valid SVG text implementation must actually resolve these glyphs.
      if (!glyphs.every(g => g.getComputedTextLength() > 0)) return;
      ready = true;
      activate();
    };
    const activate = contextSafe(() => {
      if (disposed || !ready || !inView || document.hidden || host.closest("[inert]")) {
        drift?.pause();
        entrance?.pause();
        return;
      }
      host.dataset.ready = "true";
      if (!revealed.current) {
        revealed.current = true;
        // The upstream word reveal, kept small enough for the existing heading.
        entrance = gsap.fromTo(glyphs,
          { y: 6, opacity: .65 },
          { y: 0, opacity: 1, duration: .55, stagger: .045, ease: "power4.out" });
      } else entrance?.resume();
      if (!drift) drift = gsap.to(fill, {
        x: 7, y: 3, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
      else drift.resume();
    });
    const resize = new ResizeObserver(sync);
    resize.observe(host);
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      activate();
    });
    visibility.observe(host);
    const inactive = host.closest("[inert]");
    const startup = inactive ? new MutationObserver(activate) : null;
    if (inactive) startup?.observe(inactive, { attributes: true, attributeFilter: ["inert"] });
    document.addEventListener("visibilitychange", activate);
    void document.fonts.ready.then(sync);
    sync();
    return () => {
      disposed = true;
      delete host.dataset.ready;
      resize.disconnect();
      visibility.disconnect();
      startup?.disconnect();
      document.removeEventListener("visibilitychange", activate);
    };
  }, { scope: root, dependencies: [text, reduced], revertOnUpdate: true });

  return <span ref={root} className="masked-heading" data-masked-heading>
    <span ref={measure} className="masked-heading__measure">
      {lines.map((line, lineIndex) => <Fragment key={lineIndex}>
        {lineIndex > 0 && " "}
        <span className="masked-heading__line">{line.map((word, index) => <Fragment key={`${word}-${index}`}>
          <span className="masked-heading__word">{word}<i className="masked-heading__baseline" /></span>
          {index < line.length - 1 && " "}
        </Fragment>)}</span>
      </Fragment>)}
    </span>
    {!reduced && <>
      <svg className="masked-heading__defs" aria-hidden="true" focusable="false">
        <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          {words.map((word, index) => <text key={`${word}-${index}`}>{word}</text>)}
        </clipPath></defs>
      </svg>
      <span className="masked-heading__reveal" aria-hidden="true">
        <span className="masked-heading__clip" style={{ clipPath: `url(#${clipId})` }}>
          <span ref={media} className="masked-heading__media" />
        </span>
      </span>
    </>}
  </span>;
}
