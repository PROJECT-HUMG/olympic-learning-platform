import type { FigureResolver, QuestionPart, ScientificAnswer, ScientificBlock, ScientificExplanation } from "../types/scientific-content.ts";
import { optionLabel, partLabel } from "./manual-question.ts";
import { ScientificBlockViewer } from "./scientific-block-viewer.tsx";
import { visibleToViewer, type PrivateFigureState } from "./figure-resolution.ts";

export function ManualQuestionViewer({
  title,
  stem,
  parts,
  answer,
  explanation,
  showAnswer = false,
  resolveFigure,
  figures = [],
  onRetry,
}: {
  title?: string;
  stem: ScientificBlock[];
  parts: QuestionPart[];
  answer?: ScientificAnswer | null;
  explanation?: ScientificExplanation | null;
  showAnswer?: boolean;
  resolveFigure?: FigureResolver;
  figures?: readonly PrivateFigureState[];
  onRetry?: (assetId: string) => void;
}) {
  const visibleAnswer = visibleToViewer(showAnswer, answer);
  const visibleExplanation = visibleToViewer(showAnswer, explanation);
  const pending = figures.filter((figure) => figure.phase !== "ready");
  return (
    <div className="space-y-4">
      {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
      {pending.map((figure) => (
        <p key={figure.assetId} className="flex flex-wrap items-center gap-2 text-sm" role={figure.phase === "error" ? "alert" : "status"}>
          <span>{figure.message}</span>
          {figure.phase === "error" && onRetry ? (
            <button type="button" className="min-h-11 rounded-lg border px-3" onClick={() => onRetry(figure.assetId)}>Thử lại</button>
          ) : null}
        </p>
      ))}
      <ScientificBlockViewer blocks={stem} resolveFigure={resolveFigure} />
      <ol className="space-y-4">
        {parts.map((part, index) => {
          const selected = new Set(visibleAnswer?.parts.find((item) => item.partId === part.id)?.correctOptionIds ?? []);
          const labels = part.options.flatMap((option, optionIndex) => (selected.has(option.id) ? [optionLabel(optionIndex)] : []));
          const solution = visibleExplanation?.parts.find((item) => item.partId === part.id);
          return (
            <li key={part.id} className="space-y-2">
              <p className="font-medium">Ý {partLabel(index)}</p>
              <ScientificBlockViewer blocks={part.prompt} resolveFigure={resolveFigure} />
              {part.options.length > 0 ? (
                <ul className="space-y-2">
                  {part.options.map((option, optionIndex) => (
                    <li key={option.id}>
                      <span>{optionLabel(optionIndex)}.</span>
                      <ScientificBlockViewer blocks={option.content} resolveFigure={resolveFigure} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {labels.length > 0 ? <p className="text-sm">Đáp án đúng: {labels.join(", ")}</p> : null}
              {solution && solution.solution.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Lời giải</p>
                  <ScientificBlockViewer blocks={solution.solution} resolveFigure={resolveFigure} />
                </div>
              ) : null}
              {solution && solution.rubric.trim() !== "" ? <p className="text-sm whitespace-pre-wrap">Rubric: {solution.rubric}</p> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
