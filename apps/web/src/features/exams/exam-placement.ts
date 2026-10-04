import { collectFigureAssetIds, viewerFigureGroups } from "../questions/components/figure-resolution.ts";
import type { ScientificExplanation, ScientificQuestionContent } from "../questions/types/scientific-content";
import { offsetDateTimeToLocalInput, localInputToOffsetDateTime } from "./exam-time.ts";
import type { ExamDraft, ExamDraftInput, ExamItemInput } from "./types";

export interface EditorPlacement {
  questionId: string;
  points: string;
  instructions: string;
  structure: "SINGLE" | "MULTIPART" | "UNKNOWN";
  partIds: string[];
  partPoints: Record<string, string>;
}

export interface EditorDraft {
  title: string;
  subjectId: string;
  instructions: string;
  releaseLocal: string;
  version: number | null;
  items: EditorPlacement[];
}

export type SaveResult = { ok: true; body: ExamDraftInput } | { ok: false; message: string };

export function emptyEditor(): EditorDraft {
  return { title: "", subjectId: "", instructions: "", releaseLocal: "", version: null, items: [] };
}

export function pointsToInput(value: number): string {
  return value.toFixed(2);
}
export function formatPoints(value: number): string {
  return value.toFixed(2);
}

export function parsePoints(value: string): number | null {
  const text = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0.01 || parsed > 1000) return null;
  return Math.round(parsed * 100) / 100;
}

function cents(value: number): number {
  return Math.round(value * 100);
}
function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export function alignPlacement(item: EditorPlacement, content: ScientificQuestionContent): EditorPlacement {
  const partIds = content.parts.map((part) => part.id);
  if (content.structure === "SINGLE") {
    if (item.structure === "SINGLE" && sameIds(item.partIds, partIds)) return item;
    return { ...item, structure: "SINGLE", partIds };
  }
  const partPoints = { ...item.partPoints };
  let changed = item.structure !== "MULTIPART" || !sameIds(item.partIds, partIds);
  for (const id of partIds) {
    if (!(id in partPoints)) { partPoints[id] = ""; changed = true; }
  }
  if (!changed) return item;
  return { ...item, structure: "MULTIPART", partIds, partPoints };
}

export function hydratePlacementItem(draft: EditorDraft, index: number, questionId: string, content: ScientificQuestionContent): EditorDraft {
  const row = draft.items[index];
  if (!row || row.questionId !== questionId) return draft;
  const next = alignPlacement(row, content);
  if (next === row) return draft;
  return { ...draft, items: draft.items.map((item, rowIndex) => rowIndex === index ? next : item) };
}

export function replacePlacementItem(draft: EditorDraft, index: number, update: (item: EditorPlacement) => EditorPlacement): EditorDraft {
  const row = draft.items[index];
  if (!row) return draft;
  const next = update(row);
  if (next === row) return draft;
  return { ...draft, items: draft.items.map((item, rowIndex) => rowIndex === index ? next : item) };
}

export function editorFromDraft(draft: ExamDraft): EditorDraft {
  return {
    title: draft.title,
    subjectId: draft.subjectId,
    instructions: draft.instructions,
    releaseLocal: offsetDateTimeToLocalInput(draft.releaseAt),
    version: draft.version,
    items: draft.items.map((item) => ({
      questionId: item.questionId,
      points: pointsToInput(item.points),
      instructions: item.instructions,
      structure: Object.keys(item.partPoints).length > 0 ? "UNKNOWN" : "SINGLE",
      partIds: Object.keys(item.partPoints),
      partPoints: Object.fromEntries(Object.entries(item.partPoints).map(([id, points]) => [id, pointsToInput(points)])),
    })),
  };
}

export function movePlacement(items: readonly EditorPlacement[], index: number, direction: -1 | 1): EditorPlacement[] {
  const next = index + direction;
  if (next < 0 || next >= items.length) return [...items];
  const copy = items.slice();
  const [row] = copy.splice(index, 1);
  copy.splice(next, 0, row);
  return copy;
}

function placementBody(item: EditorPlacement): { ok: true; body: ExamItemInput } | { ok: false; message: string } {
  const points = parsePoints(item.points);
  if (points === null) return { ok: false, message: "Điểm phải lớn hơn 0, tối đa 1000 và có tối đa hai chữ số thập phân." };
  const weighted = item.structure === "MULTIPART" || (item.structure === "UNKNOWN" && item.partIds.length > 0);
  if (!weighted) return { ok: true, body: { questionId: item.questionId, points, partPoints: {}, instructions: item.instructions } };
  const partPoints: Record<string, number> = {};
  let sum = 0;
  for (const id of item.partIds) {
    const weight = parsePoints(item.partPoints[id] ?? "");
    if (weight === null) return { ok: false, message: "Điểm từng ý phải dùng đúng mã ý của câu." };
    partPoints[id] = weight;
    sum += cents(weight);
  }
  if (sum !== cents(points)) return { ok: false, message: "Điểm từng ý phải cộng đúng bằng điểm câu." };
  return { ok: true, body: { questionId: item.questionId, points, partPoints, instructions: item.instructions } };
}

export function toSaveRequest(draft: EditorDraft, mode: "create" | "update"): SaveResult {
  if (!draft.subjectId) return { ok: false, message: "Hãy chọn môn học." };
  if (draft.title.length > 300) return { ok: false, message: "Tiêu đề đề quá dài." };
  if (draft.instructions.length > 4000) return { ok: false, message: "Hướng dẫn quá dài." };
  if (draft.items.length > 100) return { ok: false, message: "Một đề có tối đa 100 câu." };
  if (mode === "update" && draft.version === null) return { ok: false, message: "Hãy tải lại đề trước khi lưu." };
  const releaseAt = localInputToOffsetDateTime(draft.releaseLocal);
  if (draft.releaseLocal.trim() !== "" && releaseAt === null) return { ok: false, message: "Giờ mở đề không hợp lệ trong múi giờ trình duyệt." };
  const items: ExamItemInput[] = [];
  for (const item of draft.items) {
    const placed = placementBody(item);
    if (!placed.ok) return placed;
    items.push(placed.body);
  }
  const body: ExamDraftInput = { title: draft.title, subjectId: draft.subjectId, instructions: draft.instructions, releaseAt, items };
  if (mode === "update" && draft.version !== null) body.expectedVersion = draft.version;
  return { ok: true, body };
}

export function publishBlockers(draft: EditorDraft): string[] {
  const blockers: string[] = [];
  if (draft.version === null) blockers.push("Hãy lưu đề trước khi xuất bản.");
  if (draft.title.trim() === "") blockers.push("Cần có tiêu đề đề.");
  if (draft.releaseLocal.trim() === "") blockers.push("Cần có giờ mở đề.");
  if (draft.items.length === 0) blockers.push("Cần có ít nhất một câu.");
  return blockers;
}

export function shouldLoadServerDraft(state: { dirty: boolean; conflict: boolean }): boolean {
  return !state.dirty && !state.conflict;
}

export function placementAssetIds(content: ScientificQuestionContent, explanation: ScientificExplanation | null, showSolutions: boolean): string[] {
  return collectFigureAssetIds(viewerFigureGroups({
    showAnswer: showSolutions,
    stem: content.stem,
    parts: content.parts,
    explanation: showSolutions ? explanation : null,
  }));
}
