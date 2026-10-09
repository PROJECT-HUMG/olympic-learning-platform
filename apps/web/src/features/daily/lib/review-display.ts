import { hasUuidFormat } from "../../../lib/uuid.ts";
import type { CountRate, TaskPriority, TaskStatus } from "./completion-figures.ts";
import type { SubmitTiming } from "./platform-calendar.ts";

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  MUST: "Bắt buộc",
  SHOULD: "Nên làm",
  COULD: "Có thể làm",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "Chưa làm",
  IN_PROGRESS: "Đang làm",
  COMPLETED: "Đã xong",
};

export const SUBMIT_TIMING_LABEL: Record<SubmitTiming, string> = {
  UNSUBMITTED: "Chưa nộp",
  ON_TIME: "Đúng hạn",
  LATE: "Muộn",
};

export const NOT_APPLICABLE_LABEL = "Không áp dụng";


export interface FeedbackEntry {
  authorId: string;
  authorName: string;
  reviewId: string;
  groupId: string;
  text: string;
}

export interface FeedbackContributor {
  authorId: string;
  authorName: string;
  text: string;
}

export function plainOwnerText(value: string): string {
  return value;
}

export function formatOverall(count: CountRate): string {
  return `${count.completed}/${count.total}`;
}

export function formatMust(count: CountRate): string {
  if (count.total === 0) return NOT_APPLICABLE_LABEL;
  return `${count.completed}/${count.total}`;
}

export function formatPlannedDays(plannedDays: number): string {
  return `${plannedDays}/7`;
}

/** One current text per identified author. A later row for the same author replaces the earlier text. */
export function feedbackContributors(entries: readonly FeedbackEntry[], reviewId: string, groupId: string): { contributors: FeedbackContributor[]; distinctCount: number } {
  const byAuthor = new Map<string, FeedbackContributor>();
  for (const entry of entries) {
    if (entry.reviewId !== reviewId || entry.groupId !== groupId) continue;
    if (!hasUuidFormat(entry.authorId) || entry.authorName.trim() === "" || entry.text.trim().length === 0) continue;
    byAuthor.set(entry.authorId, { authorId: entry.authorId, authorName: entry.authorName, text: entry.text });
  }
  const contributors = [...byAuthor.values()];
  return { contributors, distinctCount: contributors.length };
}
