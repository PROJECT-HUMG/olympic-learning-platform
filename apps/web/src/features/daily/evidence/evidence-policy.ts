import { EVIDENCE_CONTRACT, EVIDENCE_MAX_BYTES, EVIDENCE_MAX_ITEMS, evidenceUploadName, readEvidenceList, readEvidenceRecord, type EvidenceExpectation } from "./evidence-contract.ts";

export function evidenceUploadIssue(file: { name: string; size: number } | null): string | null {
  if (!file) return "Chọn một tệp trước khi lưu.";
  if (!Number.isSafeInteger(file.size) || file.size < 1) return "Tệp phải có nội dung.";
  if (file.size > EVIDENCE_MAX_BYTES) return "Tệp vượt quá 5 MiB.";
  const name = evidenceUploadName(file.name);
  if (!name || [...name].length > 255) return "Tên tệp chưa hợp lệ hoặc dài hơn 255 ký tự.";
  return null;
}

export function evidenceCreationResponse(status: number, body: unknown, expected: EvidenceExpectation) {
  const row = status === 201 ? readEvidenceRecord(body, expected) : null;
  if (!row) throw new Error(EVIDENCE_CONTRACT);
  return row;
}

export function evidenceListResponse(status: number, body: unknown, expected: EvidenceExpectation) {
  const rows = status === 200 ? readEvidenceList(body, expected) : null;
  if (!rows) throw new Error(EVIDENCE_CONTRACT);
  return rows;
}

export function evidenceRoom(count: number): boolean {
  return Number.isSafeInteger(count) && count >= 0 && count < EVIDENCE_MAX_ITEMS;
}

export function evidenceScopeKey(userId: string, planId: string | null, taskId: string | null, groupId: string | null): string {
  return JSON.stringify([userId, planId, taskId, groupId]);
}
