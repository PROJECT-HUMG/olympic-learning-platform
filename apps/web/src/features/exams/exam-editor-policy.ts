import { publishBlockers, type EditorDraft } from "./exam-placement.ts";

export const SAVE_BEFORE_PUBLISH = "Hãy lưu các thay đổi trước khi xuất bản.";

export interface PublishEligibility {
  enabled: boolean;
  notice: string | null;
}

export function publishEligibility(input: {
  dirty: boolean;
  conflict: boolean;
  examId: string | undefined;
  draft: EditorDraft;
}): PublishEligibility {
  if (input.dirty) return { enabled: false, notice: SAVE_BEFORE_PUBLISH };
  if (input.conflict) return { enabled: false, notice: null };
  const blocker = publishBlockers(input.draft)[0];
  if (blocker || input.draft.version === null || !input.examId) {
    return { enabled: false, notice: blocker ?? "Hãy lưu đề trước khi xuất bản." };
  }
  return { enabled: true, notice: null };
}

export interface BankSearchKeyEvent {
  key: string;
  preventDefault: () => void;
  stopPropagation: () => void;
}

export function bankSearchKey(event: BankSearchKeyEvent): boolean {
  if (event.key !== "Enter") return false;
  event.preventDefault();
  event.stopPropagation();
  return true;
}

export function bankSearchQuery(text: string): { page: number; search: string } {
  return { page: 0, search: text.trim() };
}
