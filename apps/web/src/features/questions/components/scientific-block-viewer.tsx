import { useLayoutEffect, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import type { FigureResolver, ScientificBlock, ScientificFigure } from "../types/scientific-content";
import {
  IMAGE_FALLBACK_SUGGESTION,
  classifySource,
  classifyMathBlock,
  classifyTex,
  katexSettings,
  tokenizeTextSource,
} from "../lib/scientific-source";
import "./scientific-content.css";

export interface ScientificBlockViewerProps {
  blocks: ScientificBlock[];
  resolveFigure?: FigureResolver;
}

function SourceFailure({ source, message }: { source: string; message: string }) {
  return (
    <span className="scientific-unsupported" role="note">
      <code className="scientific-unsupported__source">{source}</code>
      <span className="scientific-unsupported__message">
        {message} {IMAGE_FALLBACK_SUGGESTION}
      </span>
    </span>
  );
}

function KatexHost({ tex, display, raw }: { tex: string; display: boolean; raw: string }) {
  const host = useRef<HTMLSpanElement>(null);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    element.replaceChildren();
    if (!tex) {
      setError(null);
      return;
    }
    try {
      katex.render(tex, element, katexSettings(display));
      setError(null);
    } catch (caught) {
      element.replaceChildren();
      setError(caught instanceof Error ? caught.message : "Không kết xuất được công thức.");
    }
    return () => element.replaceChildren();
  }, [tex, display]);

  const className = error
    ? "scientific-math scientific-math--hidden"
    : display
      ? "scientific-math scientific-math--display"
      : "scientific-math";
  return (
    <>
      {error ? <SourceFailure source={raw} message={error} /> : null}
      <span ref={host} className={className} />
    </>
  );
}

function MathOutput({ tex, display, raw }: { tex: string; display: boolean; raw: string }) {
  const decision = classifyTex(tex);
  if (!decision.ok) return <SourceFailure source={raw} message={decision.message} />;
  return <KatexHost tex={decision.tex} display={display} raw={raw} />;
}

function FigureView({
  figure,
  resolveFigure,
}: {
  figure: ScientificFigure;
  resolveFigure?: FigureResolver;
}) {
  const url = figure.assetId && resolveFigure ? resolveFigure(figure.assetId) : undefined;
  return (
    <figure className="scientific-figure">
      {url ? (
        <img src={url} alt={figure.alt} />
      ) : (
        <p className="scientific-figure__missing">{figure.alt || "Chưa có ảnh"}</p>
      )}
      {figure.caption ? <figcaption>{figure.caption}</figcaption> : null}
    </figure>
  );
}

function ViewerBlock({
  block,
  resolveFigure,
}: {
  block: ScientificBlock;
  resolveFigure?: FigureResolver;
}) {
  if (block.kind === "text") {
    const decision = classifySource(block.source);
    if (!decision.ok) return <SourceFailure source={block.source} message={decision.message} />;
    const segments = tokenizeTextSource(block.source);
    return (
      <p className="scientific-prose">
        {segments.map((segment, index) =>
          segment.kind === "text" ? (
            <span key={`${block.id}-text-${index}`}>{segment.text}</span>
          ) : (
            <MathOutput
              key={`${block.id}-math-${index}`}
              tex={segment.tex}
              display={segment.display}
              raw={segment.raw}
            />
          ),
        )}
      </p>
    );
  }

  if (block.kind === "math") {
    const decision = classifyMathBlock(block.source);
    if (!decision.ok) return <SourceFailure source={block.source} message={decision.message} />;
    return <KatexHost tex={decision.tex} display={block.display} raw={block.source} />;
  }

  const sideBySide = block.layout === "side_by_side" && block.figures.length > 1;
  return (
    <div className={sideBySide ? "scientific-figures scientific-figures--side" : "scientific-figures"}>
      {block.figures.map((figure, index) => (
        <FigureView key={`${block.id}-${index}`} figure={figure} resolveFigure={resolveFigure} />
      ))}
    </div>
  );
}

export function ScientificBlockViewer({ blocks, resolveFigure }: ScientificBlockViewerProps) {
  if (blocks.length === 0) return null;
  return (
    <div className="scientific-viewer">
      {blocks.map((block) => (
        <ViewerBlock key={block.id} block={block} resolveFigure={resolveFigure} />
      ))}
    </div>
  );
}
