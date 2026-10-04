import { usePrivateFigureResolver } from "@/features/questions/components/figure-resolution.tsx";
import { ManualQuestionViewer } from "@/features/questions/components/manual-question-viewer";
import { formatPoints, placementAssetIds } from "../exam-placement";
import type { PaperFigureState } from "../paper-figures";
import type { StaffExamItem, StudentExamItem } from "../types";

function Weights({ item }: { item: { partPoints: Record<string, number>; content: { parts: { id: string }[] } } }) {
  const ids = item.content.parts.map((part) => part.id);
  const shown = ids.length > 0 ? ids : Object.keys(item.partPoints);
  if (shown.length === 0) return null;
  return <ul className="space-y-1 text-sm">{shown.map((id, index) => <li key={id}>Ý {index + 1}: {id in item.partPoints ? `${formatPoints(item.partPoints[id])} điểm` : "Chưa có điểm"} · Mã ý: {id}</li>)}</ul>;
}

export function QuestionScopedItem({ index, item, showSolutions }: { index: number; item: StaffExamItem; showSolutions: boolean }) {
  const figures = usePrivateFigureResolver(item.questionId, placementAssetIds(item.content, item.explanation ?? null, showSolutions));
  return <ExamItemBody index={index} item={item} showSolutions={showSolutions} resolveFigure={figures.resolveFigure} figures={figures.figures} onRetry={figures.retry} />;
}

export function FrozenExamItem({ index, item, showSolutions, resolveFigure, figures, onRetry }: {
  index: number; item: StaffExamItem | StudentExamItem; showSolutions: boolean;
  resolveFigure: (assetId: string) => string | undefined; figures: readonly PaperFigureState[]; onRetry: (assetId: string) => void;
}) {
  return <ExamItemBody index={index} item={item} showSolutions={showSolutions} resolveFigure={resolveFigure} figures={figures} onRetry={onRetry} />;
}

function ExamItemBody({ index, item, showSolutions, resolveFigure, figures, onRetry }: {
  index: number; item: StaffExamItem | StudentExamItem; showSolutions: boolean;
  resolveFigure: (assetId: string) => string | undefined;
  figures: readonly { assetId: string; phase: "loading" | "ready" | "error"; message: string }[];
  onRetry: (assetId: string) => void;
}) {
  const staff = item as StaffExamItem;
  return <article className="space-y-3">
    <h3 className="text-base font-semibold">Câu {index + 1}. {item.content.title}</h3>
    <p className="text-sm">Điểm: {formatPoints(item.points)}</p>
    {item.instructions.trim() !== "" ? <p className="whitespace-pre-wrap text-sm">{item.instructions}</p> : null}
    <Weights item={item} />
    <ManualQuestionViewer stem={item.content.stem} parts={item.content.parts} answer={showSolutions ? staff.answer : undefined} explanation={showSolutions ? staff.explanation : undefined} showAnswer={showSolutions} resolveFigure={resolveFigure} figures={figures} onRetry={onRetry} />
  </article>;
}
