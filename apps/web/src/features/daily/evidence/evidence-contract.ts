import { parseApiError } from "../../../lib/api-error.ts";
import { parsePlatformDate } from "../lib/platform-calendar.ts";

export const EVIDENCE_CONTRACT = "Dữ liệu minh chứng không đúng hợp đồng.";
export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;
export const EVIDENCE_MAX_ITEMS = 10;
export const EVIDENCE_LABEL_LIMIT = 200;
export const EVIDENCE_URL_LIMIT = 2048;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INSTANT = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;
const FIELDS = ["id", "planId", "taskId", "stage", "kind", "originalName", "contentType", "sizeBytes", "url", "label", "createdAt"] as const;

export type EvidenceStage = "START" | "FINISH";
export type EvidenceKind = "FILE" | "LINK";

export interface EvidenceRecord {
  id: string;
  planId: string;
  taskId: string;
  stage: EvidenceStage;
  kind: EvidenceKind;
  originalName: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  url: string | null;
  label: string | null;
  createdAt: string;
}

export interface EvidenceExpectation {
  planId: string;
  taskId: string;
  stage?: EvidenceStage;
  kind?: EvidenceKind;
}

export interface EvidenceScope {
  userId: string;
  planId: string | null;
  taskId: string | null;
  groupId: string | null;
}

export function evidenceId(value: unknown): string | null {
  return typeof value === "string" && UUID.test(value) ? value : null;
}

export function evidenceStage(value: unknown): EvidenceStage | null {
  return value === "START" || value === "FINISH" ? value : null;
}

export function evidenceKind(value: unknown): EvidenceKind | null {
  return value === "FILE" || value === "LINK" ? value : null;
}

export function evidenceTargetReady(scope: EvidenceScope): scope is EvidenceScope & { planId: string; taskId: string } {
  return Boolean(evidenceId(scope.userId) && evidenceId(scope.planId) && evidenceId(scope.taskId) && (scope.groupId === null || evidenceId(scope.groupId)));
}

export function requireEvidenceScope(accountId: string, planId: string, taskId: string, groupId: string | null): void {
  if (!evidenceTargetReady({ userId: accountId, planId, taskId, groupId })) throw new Error(EVIDENCE_CONTRACT);
}

export function requireEvidenceItem(accountId: string, planId: string, taskId: string, evidenceIdValue: string, groupId: string | null): void {
  requireEvidenceScope(accountId, planId, taskId, groupId);
  if (!evidenceId(evidenceIdValue)) throw new Error(EVIDENCE_CONTRACT);
}

export function dailyEvidenceKey(userId: string, planId: string, taskId: string, groupId: string | null): readonly ["daily", "evidence", string, string, string, string | null] {
  return ["daily", "evidence", userId, planId, taskId, groupId];
}

export function evidenceUploadName(name: string): string | null {
  const base = name.replaceAll("\\", "/").split("/").pop() ?? "";
  const cleaned = [...base].filter((character) => !controlCharacter(character)).join("").trim();
  if (cleaned.length === 0 || cleaned === "." || cleaned === ".." || cleaned.includes("/") || cleaned.includes("\\")) return null;
  return cleaned;
}

export function evidenceFileName(name: string): string | null {
  if (name.length === 0 || name !== name.trim() || name === "." || name === "..") return null;
  if ([...name].length > 255 || [...name].some(controlCharacter) || name.includes("/") || name.includes("\\")) return null;
  return name;
}

export function evidenceLabel(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > EVIDENCE_LABEL_LIMIT || value.length > EVIDENCE_LABEL_LIMIT) return null;
  return trimmed;
}

export function evidenceHttpUrl(value: string): string | null {
  if (!/^https?:\/\//i.test(value) || value.length > EVIDENCE_URL_LIMIT || /\s/.test(value) || [...value].some(controlCharacter)) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.username !== "" || parsed.password !== "" || parsed.hostname === "") return null;
  return value;
}

function explicitInstant(value: unknown): string | null {
  if (typeof value !== "string" || !INSTANT.test(value)) return null;
  const match = INSTANT.exec(value);
  if (!match || !parsePlatformDate(match[1])) return null;
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  const second = Number(match[4]);
  if (hour > 23 || minute > 59 || second > 59) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function exactRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).length !== FIELDS.length) return null;
  for (const field of FIELDS) if (!Object.hasOwn(row, field)) return null;
  return row;
}

function fileBytes(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > EVIDENCE_MAX_BYTES) return null;
  return value;
}

export function readEvidenceRecord(value: unknown, expected: EvidenceExpectation): EvidenceRecord | null {
  const row = exactRecord(value);
  if (!row || !evidenceId(expected.planId) || !evidenceId(expected.taskId)) return null;
  const id = evidenceId(row.id);
  const planId = evidenceId(row.planId);
  const taskId = evidenceId(row.taskId);
  const stage = evidenceStage(row.stage);
  const kind = evidenceKind(row.kind);
  const createdAt = explicitInstant(row.createdAt);
  if (!id || !planId || !taskId || !stage || !kind || !createdAt) return null;
  if (planId !== expected.planId || taskId !== expected.taskId) return null;
  if (expected.stage && stage !== expected.stage) return null;
  if (expected.kind && kind !== expected.kind) return null;
  if (kind === "FILE") {
    const originalName = typeof row.originalName === "string" ? evidenceFileName(row.originalName) : null;
    const contentType = typeof row.contentType === "string" && row.contentType.length > 0 && row.contentType.length <= 255 && ![...row.contentType].some(controlCharacter) ? row.contentType : null;
    const sizeBytes = fileBytes(row.sizeBytes);
    if (!originalName || contentType === null || sizeBytes === null || row.url !== null || row.label !== null) return null;
    return { id, planId, taskId, stage, kind, originalName, contentType, sizeBytes, url: null, label: null, createdAt };
  }
  const url = typeof row.url === "string" ? evidenceHttpUrl(row.url) : null;
  const label = typeof row.label === "string" ? evidenceLabel(row.label) : null;
  if (row.originalName !== null || row.contentType !== null || row.sizeBytes !== null || !url || !label) return null;
  return { id, planId, taskId, stage, kind, originalName: null, contentType: null, sizeBytes: null, url, label, createdAt };
}

export function readEvidenceList(value: unknown, expected: Pick<EvidenceExpectation, "planId" | "taskId">): EvidenceRecord[] | null {
  if (!Array.isArray(value) || value.length > EVIDENCE_MAX_ITEMS) return null;
  const items: EvidenceRecord[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    const item = readEvidenceRecord(entry, expected);
    if (!item || seen.has(item.id)) return null;
    seen.add(item.id);
    items.push(item);
  }
  return items;
}

export function evidenceErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === EVIDENCE_CONTRACT) return EVIDENCE_CONTRACT;
  const parsed = parseApiError(error);
  if (parsed.status === 409 || parsed.messageKey === "error.resource.stateConflict" || parsed.messageKey === "error.resource.duplicate") {
    return "Bản trên máy chủ vừa đổi. Mục đã chọn vẫn được giữ.";
  }
  if (parsed.messageKey === "error.storage.tooLarge") return "Tệp vượt quá 5 MiB.";
  if (parsed.status === 403 || parsed.messageKey === "error.accessDenied") return "Bạn không có quyền thực hiện thao tác này.";
  if (parsed.status === 400 || parsed.messageKey === "error.validation") return "Dữ liệu chưa hợp lệ. Kiểm tra lại rồi thử lại.";
  if (parsed.status === 404 || parsed.messageKey === "error.resource.notFound") return "Không tìm thấy minh chứng.";
  if (parsed.detail === "Đã xảy ra lỗi không xác định. Vui lòng thử lại." || parsed.detail === "Đã xảy ra lỗi. Vui lòng thử lại.") return parsed.detail;
  return "Không thực hiện được. Hãy thử lại.";
}

function controlCharacter(character: string): boolean {
  const code = character.codePointAt(0)!;
  return code <= 31 || (code >= 127 && code <= 159);
}
