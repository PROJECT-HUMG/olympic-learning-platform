import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface ArticleTocProps {
  contentRef: React.RefObject<HTMLElement | null>;
  className?: string;
}

function parseHeadings(container: HTMLElement): TocItem[] {
  const headings = container.querySelectorAll("h2, h3");
  const items: TocItem[] = [];

  headings.forEach((heading, index) => {
    const id = heading.id || `heading-${index}`;
    if (!heading.id) {
      heading.id = id;
    }

    items.push({
      id,
      text: heading.textContent?.trim() || "",
      level: heading.tagName === "H2" ? 2 : 3,
    });
  });

  return items;
}

export function ArticleToc({ contentRef, className }: ArticleTocProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    const items = parseHeadings(contentRef.current);
    setHeadings(items);
  }, [contentRef]);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    const visibleEntries = entries.filter((entry) => entry.isIntersecting);
    if (visibleEntries.length > 0) {
      setActiveId(visibleEntries[0].target.id);
    }
  }, []);

  useEffect(() => {
    if (headings.length === 0 || !contentRef.current) return;

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: "-80px 0px -60% 0px",
      threshold: 0.1,
    });

    const container = contentRef.current;
    headings.forEach((heading) => {
      const el = container.querySelector(`#${CSS.escape(heading.id)}`);
      if (el) {
        observerRef.current?.observe(el);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings, contentRef, handleIntersect]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 96;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className={cn("space-y-1", className)} aria-label="Table of contents">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        Mục lục
      </p>
      <ul className="space-y-0.5">
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              type="button"
              onClick={() => handleClick(heading.id)}
              className={cn(
                "block w-full text-left text-[13px] leading-snug py-1.5 transition-colors duration-200 border-l-2",
                heading.level === 3 ? "pl-5" : "pl-3",
                activeId === heading.id
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
