import { hasUuidFormat } from "../../../lib/uuid.ts";
import { parseApiError } from "../../../lib/api-error.ts";
import { explicitInstant } from "./explicit-instant.ts";
import { mondayIndex, parsePlatformDate } from "./platform-calendar.ts";
import type { TaskPriority } from "./completion-figures.ts";

export const DAILY_CONTRACT = "Dữ liệu Daily không đúng hợp đồng.";

const PRIORITIES = new Set<TaskPriority>(["MUST", "SHOULD", "COULD"]);
const STATUSES = new Set<DailyEditorStatus>(["TODO", "COMPLETED"]);

export type DailyEditorStatus = "TODO" | "COMPLETED";

export interface DailyTask {
  id: string;
  title: string;
  priority: TaskPriority;
  status: DailyEditorStatus;
  position: number;
}

export interface DailyPlan {
  id: string;
  ownerId: string;
  planDate: string;
  firstSubmittedAt: string | null;
  onTime: boolean;
  reviewReasons: string | null;
  reviewWentWell: string | null;
  reviewTomorrow: string | null;
  tasks: DailyTask[];
  completedCount: number;
  totalCount: number;
  mustCompleted: number;
  mustTotal: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface DailyWeek {
  id: string | null;
  weekStart: string;
  recurringUnfinished: string | null;
  issues: string | null;
  reflection: string | null;
  nextWeekChanges: string | null;
  plannedDays: number;
  weekDays: number;
  nonemptyDays: number;
  completionRate: number | null;
  mustCompleted: number;
  mustTotal: number;
  mustRate: number | null;
  onTimeDays: number;
  version: number | null;
}

export interface DailyTaskInput {
  id?: string;
  title: string;
  priority: TaskPriority;
  status: DailyEditorStatus;
}

export interface SaveDailyPlanBody {
  expectedVersion: number | null;
  reviewReasons: string;
  reviewWentWell: string;
  reviewTomorrow: string;
  tasks: DailyTaskInput[];
}

export interface SaveDailyWeekBody {
  expectedVersion: number | null;
  recurringUnfinished: string;
  issues: string;
  reflection: string;
  nextWeekChanges: string;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : null;
}

function owned(row: Record<string, unknown>, key: string): unknown | undefined {
  return Object.hasOwn(row, key) ? row[key] : undefined;
}

function nullableText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value === "string") return value;
  return undefined;
}

function requiredInstant(value: unknown): string | null {
  return explicitInstant(value);
}

function nullableInstant(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return explicitInstant(value);
}

function uuid(value: unknown): string | null {
  return typeof value === "string" && hasUuidFormat(value) ? value : null;
}

function safeCount(value: unknown): number | null {
  if (typeof value === "number") return Number.isSafeInteger(value) && value >= 0 ? value : null;
  if (typeof value === "string" && /^(0|[1-9]\d*)$/.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

function boundedRate(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return undefined;
  return parsed;
}

function readTask(value: unknown, index: number): DailyTask | null {
  const row = record(value);
  if (!row) return null;
  const id = uuid(owned(row, "id"));
  const title = owned(row, "title");
  const priority = owned(row, "priority");
  const status = owned(row, "status");
  const position = safeCount(owned(row, "position"));
  if (!id || typeof title !== "string" || position !== index) return null;
  if (typeof priority !== "string" || !PRIORITIES.has(priority as TaskPriority)) return null;
  if (typeof status !== "string" || !STATUSES.has(status as DailyEditorStatus)) return null;
  return { id, title, priority: priority as TaskPriority, status: status as DailyEditorStatus, position };
}

export function readDailyPlan(value: unknown): DailyPlan | null {
  const row = record(value);
  if (!row || !Array.isArray(owned(row, "tasks"))) return null;
  const id = uuid(owned(row, "id"));
  const ownerId = uuid(owned(row, "ownerId"));
  const planDate = typeof owned(row, "planDate") === "string" ? parsePlatformDate(owned(row, "planDate") as string) : null;
  const firstSubmittedAt = nullableInstant(owned(row, "firstSubmittedAt"));
  const reviewReasons = nullableText(owned(row, "reviewReasons"));
  const reviewWentWell = nullableText(owned(row, "reviewWentWell"));
  const reviewTomorrow = nullableText(owned(row, "reviewTomorrow"));
  const createdAt = requiredInstant(owned(row, "createdAt"));
  const updatedAt = requiredInstant(owned(row, "updatedAt"));
  const version = safeCount(owned(row, "version"));
  const completedCount = safeCount(owned(row, "completedCount"));
  const totalCount = safeCount(owned(row, "totalCount"));
  const mustCompleted = safeCount(owned(row, "mustCompleted"));
  const mustTotal = safeCount(owned(row, "mustTotal"));
  if (!id || !ownerId || !planDate || firstSubmittedAt === undefined || firstSubmittedAt === null && owned(row, "firstSubmittedAt") !== null) return null;
  if (reviewReasons === undefined || reviewWentWell === undefined || reviewTomorrow === undefined) return null;
  if (!createdAt || !updatedAt || version === null || completedCount === null || totalCount === null || mustCompleted === null || mustTotal === null) return null;
  if (typeof owned(row, "onTime") !== "boolean") return null;
  const tasks: DailyTask[] = [];
  const seen = new Set<string>();
  for (const item of owned(row, "tasks") as unknown[]) {
    const task = readTask(item, tasks.length);
    if (!task || seen.has(task.id)) return null;
    seen.add(task.id);
    tasks.push(task);
  }
  const completed = tasks.filter((task) => task.status === "COMPLETED").length;
  const must = tasks.filter((task) => task.priority === "MUST");
  const mustDone = must.filter((task) => task.status === "COMPLETED").length;
  if (totalCount !== tasks.length || completedCount !== completed || mustTotal !== must.length || mustCompleted !== mustDone) return null;
  return {
    id, ownerId, planDate: `${planDate.year.toString().padStart(4, "0")}-${String(planDate.month).padStart(2, "0")}-${String(planDate.day).padStart(2, "0")}`,
    firstSubmittedAt, onTime: owned(row, "onTime") as boolean, reviewReasons, reviewWentWell, reviewTomorrow, tasks,
    completedCount, totalCount, mustCompleted, mustTotal, createdAt, updatedAt, version,
  };
}

export function readDailyWeek(value: unknown): DailyWeek | null {
  const row = record(value);
  if (!row) return null;
  const idValue = owned(row, "id");
  const id = idValue === null ? null : uuid(idValue);
  const weekDate = typeof owned(row, "weekStart") === "string" ? parsePlatformDate(owned(row, "weekStart") as string) : null;
  const recurringUnfinished = nullableText(owned(row, "recurringUnfinished"));
  const issues = nullableText(owned(row, "issues"));
  const reflection = nullableText(owned(row, "reflection"));
  const nextWeekChanges = nullableText(owned(row, "nextWeekChanges"));
  const plannedDays = safeCount(owned(row, "plannedDays"));
  const weekDays = safeCount(owned(row, "weekDays"));
  const nonemptyDays = safeCount(owned(row, "nonemptyDays"));
  const completionRate = boundedRate(owned(row, "completionRate"));
  const mustCompleted = safeCount(owned(row, "mustCompleted"));
  const mustTotal = safeCount(owned(row, "mustTotal"));
  const mustRate = boundedRate(owned(row, "mustRate"));
  const onTimeDays = safeCount(owned(row, "onTimeDays"));
  const versionValue = owned(row, "version");
  const version = versionValue === null ? null : safeCount(versionValue);
  if ((idValue !== null && id === null) || !weekDate || mondayIndex(weekDate) !== 0) return null;
  if (recurringUnfinished === undefined || issues === undefined || reflection === undefined || nextWeekChanges === undefined) return null;
  if (plannedDays === null || weekDays !== 7 || nonemptyDays === null || mustCompleted === null || mustTotal === null || onTimeDays === null) return null;
  if (completionRate === undefined || mustRate === undefined || (versionValue !== null && version === null)) return null;
  if ((id === null) !== (version === null)) return null;
  if (nonemptyDays > plannedDays || plannedDays > weekDays || onTimeDays > plannedDays || mustCompleted > mustTotal) return null;
  if ((completionRate === null) !== (nonemptyDays === 0)) return null;
  if ((mustRate === null) !== (mustTotal === 0)) return null;
  const weekStart = `${weekDate.year.toString().padStart(4, "0")}-${String(weekDate.month).padStart(2, "0")}-${String(weekDate.day).padStart(2, "0")}`;
  return {
    id, weekStart, recurringUnfinished, issues, reflection, nextWeekChanges, plannedDays, weekDays, nonemptyDays,
    completionRate, mustCompleted, mustTotal, mustRate, onTimeDays, version,
  };
}

export function alignedDailyPlan(plan: DailyPlan, accountId: string, date: string): DailyPlan | null {
  if (!uuid(accountId) || !parsePlatformDate(date)) return null;
  if (plan.ownerId !== accountId || plan.planDate !== date) return null;
  return plan;
}

export function alignedDailyWeek(week: DailyWeek, weekStart: string): DailyWeek | null {
  const parsed = parsePlatformDate(weekStart);
  if (!parsed || mondayIndex(parsed) !== 0 || week.weekStart !== weekStart) return null;
  return week;
}

/** Typed account and civil date, checked before a plan request is sent. */
export function requireDailyAccount(accountId: string): void {
  if (!uuid(accountId)) throw new Error(DAILY_CONTRACT);
}

export function requireDailyAccountDate(accountId: string, date: string): void {
  if (!uuid(accountId) || !parsePlatformDate(date)) throw new Error(DAILY_CONTRACT);
}

/** Typed account and Monday civil date, checked before a week request is sent. */
export function requireDailyWeekRequest(accountId: string, weekStart: string): void {
  const parsed = parsePlatformDate(weekStart);
  if (!uuid(accountId) || !parsed || mondayIndex(parsed) !== 0) throw new Error(DAILY_CONTRACT);
}

/** Plan submit also requires the path id to be a UUID before the request is sent. */
export function requireDailySubmitTarget(accountId: string, date: string, planId: string): void {
  requireDailyAccountDate(accountId, date);
  if (!uuid(planId)) throw new Error(DAILY_CONTRACT);
}

export function isMissingDailyPlan(error: unknown): boolean {
  const parsed = parseApiError(error);
  return parsed.status === 404 || parsed.messageKey === "error.resource.notFound";
}

export function isDailyConflict(error: unknown): boolean {
  const parsed = parseApiError(error);
  return parsed.status === 409 || parsed.messageKey === "error.resource.stateConflict" || parsed.messageKey === "error.resource.duplicate";
}

export function dailyErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === DAILY_CONTRACT) return DAILY_CONTRACT;
  const parsed = parseApiError(error);
  if (isDailyConflict(error)) return "Bản trên máy chủ vừa đổi. Bản bạn đang nhập vẫn được giữ.";
  if (parsed.status === 403 || parsed.messageKey === "error.accessDenied") return "Bạn không có quyền thực hiện thao tác này.";
  if (parsed.status === 400 || parsed.messageKey === "error.validation") return "Dữ liệu chưa hợp lệ. Kiểm tra lại rồi thử lại.";
  if (parsed.messageKey === "error.resource.notFound") return "Không tìm thấy kế hoạch.";
  if (parsed.detail === "Đã xảy ra lỗi không xác định. Vui lòng thử lại." || parsed.detail === "Đã xảy ra lỗi. Vui lòng thử lại.") return parsed.detail;
  return "Không thực hiện được. Hãy thử lại.";
}

export function dailyPlanKey(userId: string, date: string): readonly [string, string, string, string] {
  return ["daily", "plan", userId, date];
}

export function dailyWeekKey(userId: string, weekStart: string): readonly [string, string, string, string] {
  return ["daily", "week", userId, weekStart];
}

/** Prefix for every cached week aggregate of one account. */
export function dailyWeekAccountKey(userId: string): readonly ["daily", "week", string] {
  return ["daily", "week", userId];
}
