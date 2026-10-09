import { getPageNumber, replaceListParam } from "../../../lib/list-navigation.ts";
import { hasUuidFormat } from "../../../lib/uuid.ts";
import type { QuestionStatus, UpdateQuestionRequest } from "../types/question.types.ts";
import type { ScientificBlock, ScientificFigure } from "../types/scientific-content.ts";

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const STATUSES = new Set<QuestionStatus>(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const MANUAL_TYPES = ["single_choice", "multiple_choice", "written", "written_multipart"] as const;
export type ManualQuestionType = (typeof MANUAL_TYPES)[number];
export const TYPE_LABEL: Record<ManualQuestionType, string> = {
  single_choice: "Trắc nghiệm một đáp án",
  multiple_choice: "Trắc nghiệm nhiều đáp án",
  written: "Tự luận",
  written_multipart: "Tự luận nhiều ý",
};
export const DIFFICULTIES = [
  { value: "EASY", label: "Dễ" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HARD", label: "Khó" },
  { value: "VERY_HARD", label: "Rất khó" },
] as const;
export const LEGACY_ASSET_ADVICE =
  "Ảnh nhập từ đề nằm ở câu hỏi này. Không chuyển bản này sang nội dung thủ công. Hãy tạo bản nháp mới và tải ảnh riêng.";
export const SAVE_BEFORE_FIGURE_UPLOAD =
  "Hãy lưu bản nháp trước khi tải ảnh. Nội dung đang soạn vẫn được giữ.";
export const RESTORE_CHECK_NOTE =
  "Khôi phục kiểm tra lại môn học, chủ đề còn mở và nội dung đủ điều kiện xuất bản.";

export function isUuid(value: string): boolean {
  return hasUuidFormat(value);
}
export function isManualType(value: string): value is ManualQuestionType {
  return (MANUAL_TYPES as readonly string[]).includes(value);
}
export function partLabel(index: number): string {
  return index >= 0 && index < 26 ? String.fromCharCode(97 + index) : String(index + 1);
}
export function optionLabel(index: number): string {
  return index >= 0 && index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
}

export interface ManualOption { id: string; content: ScientificBlock[] }
export interface ManualPart {
  id: string;
  prompt: ScientificBlock[];
  options: ManualOption[];
  correctOptionIds: string[];
  solution: ScientificBlock[];
  rubric: string;
}
export interface ManualDraft {
  subjectId: string;
  topicId: string;
  type: ManualQuestionType;
  title: string;
  difficulty: string;
  stem: ScientificBlock[];
  parts: ManualPart[];
}
export interface ManualIssue { path: string; message: string }
/** API body omits non-UUID figures. `draft` still holds them; merge with retainPendingFigures after save. */
export interface DraftSave {
  request: UpdateQuestionRequest;
  draft: ManualDraft;
  pendingFigures: ScientificFigure[];
}

export function isSchemaVersionOne(content: unknown): content is Record<string, unknown> & { schemaVersion: 1 } {
  return isRecord(content) && content.schemaVersion === 1;
}
export function rejectsSchemaConversion(assets: readonly unknown[], content: unknown): boolean {
  return assets.length > 0 && isSchemaVersionOne(content);
}
export function questionPermissions(
  user: { id: string; role: string } | null | undefined,
  question: { status: string; createdById: string } | null | undefined,
) {
  const staff = user?.role === "ADMIN" || user?.role === "LECTURER";
  const manager = user?.role === "ADMIN" || Boolean(user && question && question.createdById === user.id);
  return {
    edit: Boolean(staff && manager && question?.status === "DRAFT"),
    publish: Boolean(staff && manager && question?.status === "DRAFT"),
    archive: Boolean(staff && manager && question?.status === "PUBLISHED"),
    restore: Boolean(staff && manager && question?.status === "ARCHIVED"),
    duplicate: Boolean(staff && question),
  };
}
export function questionBankLabel(content: Record<string, unknown>): string {
  if (isSchemaVersionOne(content)) {
    return typeof content.title === "string" && content.title.trim() ? content.title.trim() : "Câu hỏi chưa có tiêu đề";
  }
  const value = content.text ?? content.question ?? content.stem;
  return typeof value === "string" && value.trim() ? value : "Câu hỏi chưa có nội dung hiển thị";
}
export function questionBankQuery(params: URLSearchParams): {
  search?: string;
  subjectId?: string;
  status?: QuestionStatus;
  page: number;
} {
  const search = (params.get("search") ?? "").trim();
  const subjectId = (params.get("subjectId") ?? "").trim();
  const status = params.get("status") ?? "";
  return {
    search: search || undefined,
    subjectId: isUuid(subjectId) ? subjectId : undefined,
    status: STATUSES.has(status as QuestionStatus) ? (status as QuestionStatus) : undefined,
    page: getPageNumber(params.get("page")),
  };
}
export function replaceQuestionBankParam(
  current: URLSearchParams,
  key: "search" | "subjectId" | "status" | "page",
  value: string,
): URLSearchParams {
  return replaceListParam(current, key, value);
}
export function saveFailureNotice(status: number, detail: string): { conflict: boolean; notice: string } {
  const kept = "Nội dung đang soạn vẫn còn trên trang.";
  if (status === 409 && /updated by someone else/i.test(detail)) {
    return { conflict: true, notice: `Câu hỏi đã được lưu ở phiên bản khác. ${kept}` };
  }
  return { conflict: false, notice: `${detail.trim() || "Không lưu được bản nháp."} ${kept}` };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function forbidden(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code !== 9 && code !== 10 && code !== 13 && (code <= 31 || (code >= 127 && code <= 159))) return true;
  }
  return false;
}
function written(type: ManualQuestionType): boolean {
  return type === "written" || type === "written_multipart";
}
function responseFor(type: ManualQuestionType): "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "WRITTEN" {
  if (type === "single_choice") return "SINGLE_CHOICE";
  if (type === "multiple_choice") return "MULTIPLE_CHOICE";
  return "WRITTEN";
}
function blankPart(type: ManualQuestionType, nextId: () => string): ManualPart {
  return {
    id: nextId(),
    prompt: [],
    options: written(type) ? [] : [{ id: nextId(), content: [] }, { id: nextId(), content: [] }],
    correctOptionIds: [],
    solution: [],
    rubric: "",
  };
}
export function createManualDraft(type: ManualQuestionType, nextId: () => string = () => crypto.randomUUID()): ManualDraft {
  const count = type === "written_multipart" ? 2 : 1;
  return {
    subjectId: "",
    topicId: "",
    type,
    title: "",
    difficulty: "",
    stem: [],
    parts: Array.from({ length: count }, () => blankPart(type, nextId)),
  };
}
export function withQuestionType(draft: ManualDraft, type: ManualQuestionType, nextId: () => string = () => crypto.randomUUID()): ManualDraft {
  const blank = createManualDraft(type, nextId);
  return { ...blank, subjectId: draft.subjectId, topicId: draft.topicId, title: draft.title, difficulty: draft.difficulty, stem: draft.stem };
}
function blockText(block: ScientificBlock): boolean {
  return block.kind !== "figure_group" && block.source.trim().length > 0;
}
function blocksUsed(blocks: ScientificBlock[]): boolean {
  return blocks.some((block) => blockText(block) || (block.kind === "figure_group" && block.figures.length > 0));
}
export function draftHasPartContent(draft: ManualDraft): boolean {
  return draft.parts.some((part) => blocksUsed(part.prompt) || blocksUsed(part.solution) || part.rubric.trim().length > 0 || part.correctOptionIds.length > 0 || part.options.some((option) => blocksUsed(option.content)));
}
export function mapPart(draft: ManualDraft, index: number, mapper: (part: ManualPart) => ManualPart): ManualDraft {
  return { ...draft, parts: draft.parts.map((part, partIndex) => (partIndex === index ? mapper(part) : part)) };
}
export function addPart(draft: ManualDraft, nextId: () => string = () => crypto.randomUUID()): ManualDraft {
  if (draft.type !== "written_multipart" || draft.parts.length >= 20) return draft;
  return { ...draft, parts: [...draft.parts, blankPart(draft.type, nextId)] };
}
export function removePart(draft: ManualDraft, index: number): ManualDraft {
  if (draft.parts.length <= (draft.type === "written_multipart" ? 2 : 1)) return draft;
  return { ...draft, parts: draft.parts.filter((_, partIndex) => partIndex !== index) };
}
export function movePart(draft: ManualDraft, index: number, direction: -1 | 1): ManualDraft {
  const target = index + direction;
  if (target < 0 || target >= draft.parts.length) return draft;
  const parts = draft.parts.slice();
  const [item] = parts.splice(index, 1);
  parts.splice(target, 0, item);
  return { ...draft, parts };
}
export function addOption(draft: ManualDraft, partIndex: number, nextId: () => string = () => crypto.randomUUID()): ManualDraft {
  if (written(draft.type)) return draft;
  return mapPart(draft, partIndex, (part) => part.options.length >= 12 ? part : { ...part, options: [...part.options, { id: nextId(), content: [] }] });
}
export function removeOption(draft: ManualDraft, partIndex: number, optionIndex: number): ManualDraft {
  return mapPart(draft, partIndex, (part) => {
    const removed = part.options[optionIndex];
    if (!removed) return part;
    return {
      ...part,
      options: part.options.filter((_, index) => index !== optionIndex),
      correctOptionIds: part.correctOptionIds.filter((id) => id !== removed.id),
    };
  });
}
export function setCorrectOption(draft: ManualDraft, partIndex: number, optionId: string, selected: boolean): ManualDraft {
  return mapPart(draft, partIndex, (part) => {
    if (draft.type === "single_choice") return { ...part, correctOptionIds: selected ? [optionId] : part.correctOptionIds.filter((id) => id !== optionId) };
    const ids = new Set(part.correctOptionIds);
    if (selected) ids.add(optionId);
    else ids.delete(optionId);
    return { ...part, correctOptionIds: part.options.map((option) => option.id).filter((id) => ids.has(id)) };
  });
}

function walk(blocks: ScientificBlock[], visit: (figure: ScientificFigure) => void): void {
  for (const block of blocks) if (block.kind === "figure_group") block.figures.forEach(visit);
}
export function pendingFigures(draft: ManualDraft): ScientificFigure[] {
  const found: ScientificFigure[] = [];
  const lists = [draft.stem];
  for (const part of draft.parts) {
    lists.push(part.prompt, part.solution);
    for (const option of part.options) lists.push(option.content);
  }
  for (const blocks of lists) walk(blocks, (figure) => { if (!isUuid(figure.assetId)) found.push(figure); });
  return found;
}
function apiBlocks(blocks: ScientificBlock[]): ScientificBlock[] {
  const out: ScientificBlock[] = [];
  for (const block of blocks) {
    if (block.kind === "text") out.push({ id: block.id, kind: "text", source: block.source });
    else if (block.kind === "math") out.push({ id: block.id, kind: "math", source: block.source, display: block.display });
    else {
      const figures = block.figures.filter((figure) => isUuid(figure.assetId)).map((figure) => ({ assetId: figure.assetId, alt: figure.alt, caption: figure.caption }));
      if (figures.length > 0) out.push({ id: block.id, kind: "figure_group", layout: block.layout, figures });
    }
  }
  return out;
}
export function persistDraft(draft: ManualDraft, expectedVersion: number | null): DraftSave {
  const choice = !written(draft.type);
  const content = {
    schemaVersion: 1 as const,
    title: draft.title,
    structure: draft.type === "written_multipart" ? "MULTIPART" as const : "SINGLE" as const,
    stem: apiBlocks(draft.stem),
    parts: draft.parts.map((part) => ({
      id: part.id,
      responseType: responseFor(draft.type),
      prompt: apiBlocks(part.prompt),
      options: choice ? part.options.map((option) => ({ id: option.id, content: apiBlocks(option.content) })) : [],
    })),
  };
  const answer = { parts: draft.parts.map((part) => ({ partId: part.id, correctOptionIds: choice ? part.correctOptionIds : [] })) };
  const explained = draft.parts.flatMap((part) => {
    const solution = apiBlocks(part.solution);
    if (solution.length === 0 && part.rubric.length === 0) return [];
    return [{ partId: part.id, solution, rubric: part.rubric }];
  });
  const request: UpdateQuestionRequest = {
    subjectId: draft.subjectId,
    topicId: draft.topicId,
    type: draft.type,
    content,
    answer,
    explanation: explained.length > 0 ? { parts: explained } : null,
    difficulty: draft.difficulty.trim() ? draft.difficulty.trim() : null,
  };
  if (expectedVersion !== null) request.expectedVersion = expectedVersion;
  return { request, draft: structuredClone(draft), pendingFigures: pendingFigures(draft) };
}
function mergeBlocks(saved: ScientificBlock[], local: ScientificBlock[]): ScientificBlock[] {
  return local.map((block) => {
    const match = saved.find((item) => item.id === block.id);
    if (block.kind !== "figure_group") return match ?? block;
    if (!match || match.kind !== "figure_group") return block;
    const server = match;
    return {
      ...server,
      figures: block.figures.map((figure) => isUuid(figure.assetId) ? server.figures.find((item) => item.assetId === figure.assetId) ?? figure : figure),
    };
  });
}
/** Puts figures the API omitted back onto the server-shaped draft. Local source text stays unless the saved block is the same id. */
export function retainPendingFigures(local: ManualDraft, saved: ManualDraft): ManualDraft {
  return {
    ...saved,
    stem: mergeBlocks(saved.stem, local.stem),
    parts: local.parts.map((part) => {
      const server = saved.parts.find((item) => item.id === part.id);
      if (!server) return part;
      return {
        ...server,
        prompt: mergeBlocks(server.prompt, part.prompt),
        solution: mergeBlocks(server.solution, part.solution),
        options: part.options.map((option) => {
          const match = server.options.find((item) => item.id === option.id);
          return match ? { ...match, content: mergeBlocks(match.content, option.content) } : option;
        }),
      };
    }),
  };
}

function issue(issues: ManualIssue[], path: string, message: string): void {
  issues.push({ path, message });
}
function checkText(value: string, max: number, path: string, label: string, issues: ManualIssue[]): void {
  if (value.length > max || forbidden(value)) issue(issues, path, `${label} không hợp lệ.`);
}
function checkBlocks(blocks: ScientificBlock[], path: string, issues: ManualIssue[]): void {
  if (blocks.length > 40) issue(issues, path, "Quá nhiều khối.");
  const ids = new Set<string>();
  blocks.forEach((block, index) => {
    if (!SAFE_ID.test(block.id) || ids.has(block.id)) issue(issues, `${path}.${index}`, "Mã khối không hợp lệ.");
    ids.add(block.id);
    if (block.kind !== "figure_group") checkText(block.source, 16000, `${path}.${index}`, "Nguồn", issues);
    else {
      if (block.figures.length > 2) issue(issues, `${path}.${index}`, "Một nhóm hình có tối đa 2 ảnh.");
      block.figures.forEach((figure, figureIndex) => {
        if (figure.assetId !== "" && !isUuid(figure.assetId)) issue(issues, `${path}.${index}.${figureIndex}`, "Mã ảnh không hợp lệ.");
        checkText(figure.alt, 500, `${path}.${index}.${figureIndex}.alt`, "Alt", issues);
        checkText(figure.caption, 500, `${path}.${index}.${figureIndex}.caption`, "Chú thích", issues);
      });
    }
  });
}
export function draftIssues(draft: ManualDraft): ManualIssue[] {
  const issues: ManualIssue[] = [];
  if (!draft.subjectId.trim() || !draft.topicId.trim()) issue(issues, "placement", "Bản nháp cần môn và chủ đề.");
  if (!isManualType(draft.type)) issue(issues, "type", "Dạng câu hỏi không hợp lệ.");
  checkText(draft.title, 300, "title", "Tiêu đề", issues);
  if (draft.difficulty && !DIFFICULTIES.some((item) => item.value === draft.difficulty)) issue(issues, "difficulty", "Độ khó không hợp lệ.");
  checkBlocks(draft.stem, "stem", issues);
  const partMax = draft.type === "written_multipart" ? 20 : 1;
  if (draft.parts.length > partMax) issue(issues, "parts", "Số phần không hợp lệ.");
  const partIds = new Set<string>();
  draft.parts.forEach((part, index) => {
    if (!SAFE_ID.test(part.id) || partIds.has(part.id)) issue(issues, `parts.${index}`, "Mã phần không hợp lệ.");
    partIds.add(part.id);
    checkBlocks(part.prompt, `parts.${index}.prompt`, issues);
    checkBlocks(part.solution, `parts.${index}.solution`, issues);
    checkText(part.rubric, 4000, `parts.${index}.rubric`, "Rubric", issues);
    if (written(draft.type) && part.options.length > 0) issue(issues, `parts.${index}.options`, "Phần tự luận không có phương án.");
    if (part.options.length > 12) issue(issues, `parts.${index}.options`, "Quá nhiều phương án.");
    const optionIds = new Set<string>();
    part.options.forEach((option, optionIndex) => {
      if (!SAFE_ID.test(option.id) || optionIds.has(option.id)) issue(issues, `parts.${index}.options.${optionIndex}`, "Mã phương án không hợp lệ.");
      optionIds.add(option.id);
      checkBlocks(option.content, `parts.${index}.options.${optionIndex}`, issues);
    });
    const correct = new Set<string>();
    part.correctOptionIds.forEach((id) => {
      if (!SAFE_ID.test(id) || correct.has(id)) issue(issues, `parts.${index}.answer`, "Đáp án không hợp lệ.");
      correct.add(id);
    });
  });
  return issues;
}
function publishFigureIssues(blocks: ScientificBlock[], path: string, issues: ManualIssue[]): void {
  blocks.forEach((block, index) => {
    if (block.kind !== "figure_group") return;
    if (block.figures.length === 0) issue(issues, `${path}.${index}`, "Nhóm hình cần có ảnh trước khi xuất bản.");
    block.figures.forEach((figure, figureIndex) => {
      if (isUuid(figure.assetId) && figure.alt.trim() === "") issue(issues, `${path}.${index}.${figureIndex}.alt`, "Ảnh xuất bản cần mô tả alt.");
    });
  });
}
function meaningful(blocks: ScientificBlock[]): boolean {
  return blocks.some((block) => blockText(block) || (block.kind === "figure_group" && block.figures.some((figure) => isUuid(figure.assetId))));
}
export function publishIssues(draft: ManualDraft): ManualIssue[] {
  const issues = draftIssues(draft);
  if (!draft.title.trim()) issue(issues, "title", "Hãy nhập tiêu đề trước khi xuất bản.");
  if (pendingFigures(draft).length > 0) issue(issues, "figures", "Ảnh chưa tải xong vẫn nằm trong bản soạn. Hãy tải ảnh hoặc xóa nhóm hình trước khi xuất bản.");
  publishFigureIssues(draft.stem, "stem", issues);
  draft.parts.forEach((part, index) => {
    publishFigureIssues(part.prompt, `parts.${index}.prompt`, issues);
    publishFigureIssues(part.solution, `parts.${index}.solution`, issues);
    part.options.forEach((option, optionIndex) => publishFigureIssues(option.content, `parts.${index}.options.${optionIndex}`, issues));
  });
  if (draft.type === "written_multipart") {
    if (draft.parts.length < 2) issue(issues, "parts", "Tự luận nhiều ý cần ít nhất phần a và phần b.");
    draft.parts.forEach((part, index) => { if (!meaningful(part.prompt)) issue(issues, `parts.${index}.prompt`, `Phần ${partLabel(index)} cần nội dung.`); });
  } else if (draft.parts.length !== 1) issue(issues, "parts", "Dạng này có một phần.");
  else {
    const part = draft.parts[0];
    if (!meaningful(draft.stem) && !meaningful(part.prompt)) issue(issues, "stem", "Đề hoặc phần hỏi cần nội dung.");
    if (!written(draft.type)) {
      if (part.options.length < 2 || part.options.some((option) => !meaningful(option.content))) issue(issues, "options", "Cần ít nhất hai phương án có nội dung.");
      const known = new Set(part.options.map((option) => option.id));
      if (part.correctOptionIds.some((id) => !known.has(id))) issue(issues, "answer", "Đáp án không thuộc phương án.");
      if (draft.type === "single_choice" && part.correctOptionIds.length !== 1) issue(issues, "answer", "Chọn một đáp án đúng trước khi xuất bản.");
      if (draft.type === "multiple_choice" && part.correctOptionIds.length < 1) issue(issues, "answer", "Chọn ít nhất một đáp án đúng trước khi xuất bản.");
    }
  }
  draft.parts.forEach((part, index) => {
    if (written(draft.type) && part.correctOptionIds.length > 0) issue(issues, `parts.${index}.answer`, "Phần tự luận không có đáp án trắc nghiệm.");
  });
  return issues;
}

const CONTENT_KEYS = ["schemaVersion", "title", "structure", "stem", "parts"];
const TEXT_KEYS = ["id", "kind", "source"];
const MATH_KEYS = ["id", "kind", "source", "display"];
const GROUP_KEYS = ["id", "kind", "layout", "figures"];
const FIGURE_KEYS = ["assetId", "alt", "caption"];
const PART_KEYS = ["id", "responseType", "prompt", "options"];
const OPTION_KEYS = ["id", "content"];
const ANSWER_KEYS = ["parts"];
const ANSWER_PART_KEYS = ["partId", "correctOptionIds"];
const EXPLANATION_KEYS = ["parts"];
const SOLUTION_KEYS = ["partId", "solution", "rubric"];

export interface ReopenedDraft {
  draft: ManualDraft;
  lossy: boolean;
}

/** Local navigation draft. `lossy` refuses another save. Version 0 is valid. */
export interface ManualAuthorHandoff {
  questionId: string | null;
  draft: ManualDraft;
  version: number | null;
  status: QuestionStatus | null;
  notice: string | null;
  lossy: boolean;
}

function onlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}
function sameJson(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || left === undefined || right === undefined) return left === right;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((item, index) => sameJson(item, right[index]));
  }
  if (typeof left !== "object" || typeof right !== "object") return false;
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const keys = Object.keys(leftRecord);
  return keys.length === Object.keys(rightRecord).length && keys.every((key) => Object.hasOwn(rightRecord, key) && sameJson(leftRecord[key], rightRecord[key]));
}
function sameExplanation(projected: unknown, stored: unknown): boolean {
  if (projected == null) {
    if (stored == null) return true;
    if (!isRecord(stored)) return false;
    if (Object.keys(stored).length === 0) return true;
    return onlyKeys(stored, ["parts"]) && Array.isArray(stored.parts) && stored.parts.length === 0;
  }
  return sameJson(projected, stored);
}
function sameProjection(draft: ManualDraft, content: unknown, answer: unknown, explanation: unknown, difficulty: string | null | undefined): boolean {
  const save = persistDraft(draft, null);
  const storedDifficulty = difficulty == null || difficulty === "" ? null : difficulty;
  return sameJson(save.request.content, content)
    && sameJson(save.request.answer, answer)
    && sameExplanation(save.request.explanation ?? null, explanation)
    && (save.request.difficulty ?? null) === storedDifficulty;
}
function readBlock(value: unknown, mark: () => void): ScientificBlock | null {
  if (!isRecord(value) || typeof value.kind !== "string") {
    mark();
    return null;
  }
  if (value.kind === "text") {
    if (!onlyKeys(value, TEXT_KEYS) || typeof value.id !== "string" || typeof value.source !== "string") {
      mark();
      return null;
    }
    return { id: value.id, kind: "text", source: value.source };
  }
  if (value.kind === "math") {
    if (!onlyKeys(value, MATH_KEYS) || typeof value.id !== "string" || typeof value.source !== "string" || typeof value.display !== "boolean") {
      mark();
      return null;
    }
    return { id: value.id, kind: "math", source: value.source, display: value.display };
  }
  if (value.kind === "figure_group") {
    if (!onlyKeys(value, GROUP_KEYS) || typeof value.id !== "string" || (value.layout !== "full_width" && value.layout !== "side_by_side") || !Array.isArray(value.figures)) {
      mark();
      return null;
    }
    const figures: ScientificFigure[] = [];
    for (const figure of value.figures) {
      if (!isRecord(figure) || !onlyKeys(figure, FIGURE_KEYS) || typeof figure.assetId !== "string" || typeof figure.alt !== "string" || typeof figure.caption !== "string") {
        mark();
        continue;
      }
      figures.push({ assetId: figure.assetId, alt: figure.alt, caption: figure.caption });
    }
    return { id: value.id, kind: "figure_group", layout: value.layout, figures };
  }
  mark();
  return null;
}
function readBlocks(value: unknown, mark: () => void): ScientificBlock[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    mark();
    return [];
  }
  const blocks: ScientificBlock[] = [];
  for (const item of value) {
    const block = readBlock(item, mark);
    if (block) blocks.push(block);
  }
  return blocks;
}
function readOptions(value: unknown, mark: () => void): ManualOption[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    mark();
    return [];
  }
  const options: ManualOption[] = [];
  for (const item of value) {
    if (!isRecord(item) || !onlyKeys(item, OPTION_KEYS) || typeof item.id !== "string") {
      mark();
      continue;
    }
    options.push({ id: item.id, content: readBlocks(item.content, mark) });
  }
  return options;
}
function readParts(value: unknown, type: ManualQuestionType, mark: () => void): ManualPart[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    mark();
    return [];
  }
  const expected = responseFor(type);
  const parts: ManualPart[] = [];
  for (const item of value) {
    if (!isRecord(item) || !onlyKeys(item, PART_KEYS) || typeof item.id !== "string") {
      mark();
      continue;
    }
    if (item.responseType !== undefined && item.responseType !== expected) mark();
    parts.push({
      id: item.id,
      prompt: readBlocks(item.prompt, mark),
      options: readOptions(item.options, mark),
      correctOptionIds: [],
      solution: [],
      rubric: "",
    });
  }
  return parts;
}
function applyAnswer(parts: ManualPart[], answer: unknown, mark: () => void): void {
  if (answer == null) return;
  if (!isRecord(answer) || !onlyKeys(answer, ANSWER_KEYS)) {
    mark();
    return;
  }
  if (answer.parts === undefined) return;
  if (!Array.isArray(answer.parts)) {
    mark();
    return;
  }
  const byId = new Map(parts.map((part) => [part.id, part]));
  const seen = new Set<string>();
  for (const item of answer.parts) {
    if (!isRecord(item) || !onlyKeys(item, ANSWER_PART_KEYS) || typeof item.partId !== "string" || !Array.isArray(item.correctOptionIds) || item.correctOptionIds.some((id) => typeof id !== "string")) {
      mark();
      continue;
    }
    if (seen.has(item.partId)) {
      mark();
      continue;
    }
    seen.add(item.partId);
    const part = byId.get(item.partId);
    if (!part) {
      mark();
      continue;
    }
    part.correctOptionIds = item.correctOptionIds.slice();
  }
}
function applyExplanation(parts: ManualPart[], explanation: unknown, mark: () => void): void {
  if (explanation == null) return;
  if (!isRecord(explanation)) {
    mark();
    return;
  }
  if (Object.keys(explanation).length === 0) return;
  if (!onlyKeys(explanation, EXPLANATION_KEYS)) {
    mark();
    return;
  }
  if (explanation.parts === undefined) return;
  if (!Array.isArray(explanation.parts)) {
    mark();
    return;
  }
  const byId = new Map(parts.map((part) => [part.id, part]));
  const seen = new Set<string>();
  for (const item of explanation.parts) {
    if (!isRecord(item) || !onlyKeys(item, SOLUTION_KEYS) || typeof item.partId !== "string") {
      mark();
      continue;
    }
    if (seen.has(item.partId)) {
      mark();
      continue;
    }
    seen.add(item.partId);
    const part = byId.get(item.partId);
    if (!part) {
      mark();
      continue;
    }
    if (item.solution !== undefined) part.solution = readBlocks(item.solution, mark);
    if (item.rubric === undefined) continue;
    if (typeof item.rubric !== "string") mark();
    else part.rubric = item.rubric;
  }
}

/** Copies schemaVersion 1 into a draft. `lossy` means a later save would drop or rewrite stored JSON. */
export function reopenManualDraft(source: {
  subjectId: string;
  topicId: string;
  type: string;
  difficulty?: string | null;
  content: unknown;
  answer: unknown;
  explanation: unknown;
}): ReopenedDraft {
  const loss = { current: false };
  const mark = () => {
    loss.current = true;
  };
  let type: ManualQuestionType = "single_choice";
  if (isManualType(source.type)) type = source.type;
  else mark();
  const subjectId = typeof source.subjectId === "string" ? source.subjectId : (mark(), "");
  const topicId = typeof source.topicId === "string" ? source.topicId : (mark(), "");
  const difficulty = source.difficulty == null || source.difficulty === ""
    ? ""
    : typeof source.difficulty === "string" ? source.difficulty : (mark(), "");
  const content = isRecord(source.content) ? source.content : null;
  if (content == null || !isSchemaVersionOne(content) || !onlyKeys(content, CONTENT_KEYS)) mark();
  const record = content ?? {};
  const expectedStructure = type === "written_multipart" ? "MULTIPART" : "SINGLE";
  if (record.structure !== undefined && record.structure !== expectedStructure) mark();
  const title = typeof record.title === "string" ? record.title : (record.title === undefined ? "" : (mark(), ""));
  const stem = readBlocks(record.stem, mark);
  const parts = readParts(record.parts, type, mark);
  applyAnswer(parts, source.answer, mark);
  applyExplanation(parts, source.explanation, mark);
  const draft: ManualDraft = { subjectId, topicId, type, title, difficulty, stem, parts };
  if (!loss.current && content && !sameProjection(draft, content, source.answer, source.explanation, source.difficulty)) mark();
  return { draft, lossy: loss.current };
}

function isBlock(value: unknown): value is ScientificBlock {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.kind !== "string") return false;
  if (value.kind === "text") return onlyKeys(value, TEXT_KEYS) && typeof value.source === "string";
  if (value.kind === "math") return onlyKeys(value, MATH_KEYS) && typeof value.source === "string" && typeof value.display === "boolean";
  if (value.kind !== "figure_group") return false;
  return onlyKeys(value, GROUP_KEYS)
    && (value.layout === "full_width" || value.layout === "side_by_side")
    && Array.isArray(value.figures)
    && value.figures.every((figure) => isRecord(figure) && onlyKeys(figure, FIGURE_KEYS) && typeof figure.assetId === "string" && typeof figure.alt === "string" && typeof figure.caption === "string");
}
function isOption(value: unknown): value is ManualOption {
  return isRecord(value) && onlyKeys(value, OPTION_KEYS) && typeof value.id === "string" && Array.isArray(value.content) && value.content.every(isBlock);
}
function isPart(value: unknown): value is ManualPart {
  if (!isRecord(value) || !onlyKeys(value, ["id", "prompt", "options", "correctOptionIds", "solution", "rubric"])) return false;
  if (typeof value.id !== "string" || typeof value.rubric !== "string") return false;
  if (!Array.isArray(value.prompt) || !value.prompt.every(isBlock)) return false;
  if (!Array.isArray(value.solution) || !value.solution.every(isBlock)) return false;
  if (!Array.isArray(value.options) || !value.options.every(isOption)) return false;
  return Array.isArray(value.correctOptionIds) && value.correctOptionIds.every((id) => typeof id === "string");
}
function isManualDraft(value: unknown): value is ManualDraft {
  if (!isRecord(value) || !onlyKeys(value, ["subjectId", "topicId", "type", "title", "difficulty", "stem", "parts"])) return false;
  if (typeof value.subjectId !== "string" || typeof value.topicId !== "string" || typeof value.title !== "string" || typeof value.difficulty !== "string") return false;
  if (typeof value.type !== "string" || !isManualType(value.type)) return false;
  return Array.isArray(value.stem) && value.stem.every(isBlock) && Array.isArray(value.parts) && value.parts.every(isPart);
}
function readHandoffVersion(questionId: string | null, version: unknown): number | null | undefined {
  if (questionId === null) return version == null ? null : undefined;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 0) return undefined;
  return version;
}
function readHandoffStatus(value: unknown): QuestionStatus | null | undefined {
  if (value == null) return null;
  if (value === "DRAFT" || value === "PUBLISHED" || value === "ARCHIVED") return value;
  return undefined;
}
export function readManualAuthorHandoff(state: unknown): ManualAuthorHandoff | null {
  if (!isRecord(state) || !isRecord(state.manualHandoff)) return null;
  const raw = state.manualHandoff;
  let questionId: string | null;
  if (raw.questionId === null) questionId = null;
  else if (typeof raw.questionId === "string" && raw.questionId.length > 0) questionId = raw.questionId;
  else return null;
  const version = readHandoffVersion(questionId, raw.version);
  const status = readHandoffStatus(raw.status);
  if (version === undefined || status === undefined || typeof raw.lossy !== "boolean") return null;
  if (raw.notice != null && typeof raw.notice !== "string") return null;
  if (!isManualDraft(raw.draft)) return null;
  const notice = raw.notice ?? null;
  return { questionId, draft: structuredClone(raw.draft), version, status, notice, lossy: raw.lossy };
}
