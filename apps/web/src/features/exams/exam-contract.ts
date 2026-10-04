import { ApiError, parseApiError } from "../../lib/api-error.ts";
import type { ScientificExplanation, ScientificQuestionContent } from "../questions/types/scientific-content";
import type { ExamDraft, ExamItemInput, ExamPaperSummary, StaffExamItem, StaffExamView, StudentExamItem, StudentExamPaper } from "./types";

export const EXAM_CONTRACT = "Dữ liệu đề không đúng hợp đồng.";

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
function number(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}
function nullableText(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : undefined;
}
function nullableNumber(value: unknown): number | null | undefined {
  if (value === null || value === undefined) return null;
  return number(value);
}
function partPoints(value: unknown): Record<string, number> | null {
  const source = record(value);
  if (!source) return null;
  const points: Record<string, number> = {};
  for (const [key, item] of Object.entries(source)) {
    const parsed = number(item);
    if (key.length === 0 || parsed === null) return null;
    points[key] = parsed;
  }
  return points;
}

export function readManualContent(value: unknown): ScientificQuestionContent | null {
  const source = record(value);
  if (!source || source.schemaVersion !== 1) return null;
  if (source.structure !== "SINGLE" && source.structure !== "MULTIPART") return null;
  if (typeof source.title !== "string" || !Array.isArray(source.stem) || !Array.isArray(source.parts)) return null;
  const parts: ScientificQuestionContent["parts"] = [];
  for (const part of source.parts) {
    const row = record(part);
    if (!row || typeof row.id !== "string" || !Array.isArray(row.prompt) || !Array.isArray(row.options)) return null;
    if (row.responseType !== "SINGLE_CHOICE" && row.responseType !== "MULTIPLE_CHOICE" && row.responseType !== "WRITTEN") return null;
    parts.push(part as ScientificQuestionContent["parts"][number]);
  }
  return { schemaVersion: 1, title: source.title, structure: source.structure, stem: source.stem as ScientificQuestionContent["stem"], parts };
}

function readPlacement(value: unknown, withContent: boolean): (ExamItemInput & { content?: ScientificQuestionContent }) | null {
  const source = record(value);
  if (!source) return null;
  const questionId = text(source.questionId);
  const points = number(source.points);
  const weights = partPoints(source.partPoints);
  const instructions = text(source.instructions);
  if (!questionId || points === null || !weights || instructions === null) return null;
  if (!withContent) return { questionId, points, partPoints: weights, instructions };
  const content = readManualContent(source.content);
  if (!content) return null;
  return { questionId, points, partPoints: weights, instructions, content };
}

export function readExamDraft(value: unknown): ExamDraft | null {
  const source = record(value);
  if (!source || !Array.isArray(source.items)) return null;
  const id = text(source.id);
  const createdById = text(source.createdById);
  const version = number(source.version);
  const latest = nullableNumber(source.latestPublishedVersion);
  const totalPoints = number(source.totalPoints);
  const title = text(source.title);
  const subjectId = text(source.subjectId);
  const instructions = text(source.instructions);
  const releaseAt = nullableText(source.releaseAt);
  if (!id || !createdById || version === null || latest === undefined || totalPoints === null || title === null || !subjectId || instructions === null || releaseAt === undefined) return null;
  const items: ExamItemInput[] = [];
  for (const item of source.items) {
    const placement = readPlacement(item, false);
    if (!placement) return null;
    items.push(placement);
  }
  return { id, createdById, version, latestPublishedVersion: latest, totalPoints, title, subjectId, instructions, releaseAt, items };
}

export function readExamDraftList(value: unknown): ExamDraft[] | null {
  if (!Array.isArray(value)) return null;
  const drafts: ExamDraft[] = [];
  for (const item of value) {
    const draft = readExamDraft(item);
    if (!draft) return null;
    drafts.push(draft);
  }
  return drafts;
}

export function readSummaryList(value: unknown): ExamPaperSummary[] | null {
  if (!Array.isArray(value)) return null;
  const papers: ExamPaperSummary[] = [];
  for (const item of value) {
    const source = record(item);
    if (!source) return null;
    const id = text(source.id);
    const examId = text(source.examId);
    const versionNumber = number(source.versionNumber);
    const title = text(source.title);
    const subjectId = text(source.subjectId);
    const releaseAt = text(source.releaseAt);
    const publishedAt = text(source.publishedAt);
    const totalPoints = number(source.totalPoints);
    if (!id || !examId || versionNumber === null || title === null || !subjectId || !releaseAt || !publishedAt || totalPoints === null) return null;
    papers.push({ id, examId, versionNumber, title, subjectId, releaseAt, publishedAt, totalPoints });
  }
  return papers;
}

export function readStaffExamView(value: unknown): StaffExamView | null {
  const source = record(value);
  if (!source || !Array.isArray(source.items)) return null;
  const id = nullableText(source.id);
  const examId = text(source.examId);
  const versionNumber = nullableNumber(source.versionNumber);
  const title = text(source.title);
  const subjectId = text(source.subjectId);
  const instructions = text(source.instructions);
  const releaseAt = nullableText(source.releaseAt);
  const publishedAt = nullableText(source.publishedAt);
  const totalPoints = number(source.totalPoints);
  if (id === undefined || !examId || versionNumber === undefined || title === null || !subjectId || instructions === null || releaseAt === undefined || publishedAt === undefined || totalPoints === null) return null;
  const items: StaffExamItem[] = [];
  for (const item of source.items) {
    const row = record(item);
    const placement = readPlacement(item, true);
    if (!row || !placement?.content) return null;
    const next: StaffExamItem = { questionId: placement.questionId, points: placement.points, partPoints: placement.partPoints, instructions: placement.instructions, content: placement.content };
    if ("answer" in row && row.answer != null) next.answer = row.answer as StaffExamItem["answer"];
    if ("explanation" in row && row.explanation != null) {
      const explanation = record(row.explanation);
      if (!explanation || !Array.isArray(explanation.parts)) return null;
      next.explanation = row.explanation as ScientificExplanation;
    }
    items.push(next);
  }
  return { id, examId, versionNumber, title, subjectId, instructions, releaseAt, publishedAt, totalPoints, items };
}

export function readStudentExamPaper(value: unknown): StudentExamPaper | null {
  const source = record(value);
  if (!source || !Array.isArray(source.items)) return null;
  const id = text(source.id);
  const examId = text(source.examId);
  const versionNumber = number(source.versionNumber);
  const title = text(source.title);
  const subjectId = text(source.subjectId);
  const instructions = text(source.instructions);
  const releaseAt = text(source.releaseAt);
  const publishedAt = text(source.publishedAt);
  const totalPoints = number(source.totalPoints);
  if (!id || !examId || versionNumber === null || title === null || !subjectId || instructions === null || !releaseAt || !publishedAt || totalPoints === null) return null;
  const items: StudentExamItem[] = [];
  for (const item of source.items) {
    const placement = readPlacement(item, true);
    if (!placement?.content) return null;
    items.push({ questionId: placement.questionId, points: placement.points, partPoints: placement.partPoints, instructions: placement.instructions, content: placement.content });
  }
  return { id, examId, versionNumber, title, subjectId, instructions, releaseAt, publishedAt, totalPoints, items };
}

export function frozenPaperId(view: StaffExamView): string | null {
  if (view.id && view.versionNumber !== null && view.releaseAt && view.publishedAt) return view.id;
  return null;
}

export function isExamConflict(error: unknown): boolean {
  const parsed = parseApiError(error);
  return parsed.status === 409 || parsed.code === "RESOURCE_STATE_CONFLICT";
}

export function examErrorMessage(error: unknown): string {
  if (error instanceof Error && !(error instanceof ApiError) && error.message === EXAM_CONTRACT) return EXAM_CONTRACT;
  if (isExamConflict(error)) return "Đề vừa được sửa ở nơi khác. Bản bạn đang nhập vẫn được giữ.";
  const known: Record<string, string> = {
    "Exam title is required": "Cần có tiêu đề đề.",
    "Exam title is too long": "Tiêu đề đề quá dài.",
    "Instructions are too long": "Hướng dẫn quá dài.",
    "Exam release time is required": "Cần có giờ mở đề.",
    "Exam items are required": "Cần có ít nhất một câu.",
    "An exam can contain at most 100 items": "Một đề có tối đa 100 câu.",
    "Points are required": "Cần có điểm.",
    "Points support at most two decimal places": "Điểm có tối đa hai chữ số thập phân.",
    "Points must be positive and at most 1000": "Điểm phải lớn hơn 0 và không quá 1000.",
    "Part points are required": "Cần có điểm từng ý.",
    "Part points must use the question part ids": "Điểm từng ý phải dùng đúng mã ý của câu.",
    "Part points must sum to the item points": "Điểm từng ý phải cộng đúng bằng điểm câu.",
  };
  const detail = parseApiError(error).detail;
  return known[detail] ?? "Không thực hiện được thao tác với đề. Hãy kiểm tra môn, câu đã xuất bản và điểm rồi thử lại.";
}
