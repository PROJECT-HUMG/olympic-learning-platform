import type { TaskPriority } from "./completion-figures.ts";
import type { DailyEditorStatus, DailyPlan, DailyWeek, SaveDailyPlanBody, SaveDailyWeekBody } from "./daily-contract.ts";
import { NOT_APPLICABLE_LABEL } from "./review-display.ts";

export interface EditorTask {
  key: string;
  id: string | null;
  title: string;
  priority: TaskPriority;
  status: DailyEditorStatus;
}

export interface PlanEditor {
  id: string | null;
  version: number | null;
  planDate: string;
  firstSubmittedAt: string | null;
  onTime: boolean;
  reviewReasons: string;
  reviewWentWell: string;
  reviewTomorrow: string;
  tasks: EditorTask[];
}

export interface WeekEditor {
  id: string | null;
  version: number | null;
  weekStart: string;
  recurringUnfinished: string;
  issues: string;
  reflection: string;
  nextWeekChanges: string;
}

export type SaveReady<T> = { ok: true; body: T } | { ok: false; message: string };

export function emptyPlanEditor(planDate: string): PlanEditor {
  return {
    id: null, version: null, planDate, firstSubmittedAt: null, onTime: false,
    reviewReasons: "", reviewWentWell: "", reviewTomorrow: "", tasks: [],
  };
}

export function editorFromPlan(plan: DailyPlan): PlanEditor {
  return {
    id: plan.id, version: plan.version, planDate: plan.planDate, firstSubmittedAt: plan.firstSubmittedAt, onTime: plan.onTime,
    reviewReasons: plan.reviewReasons ?? "", reviewWentWell: plan.reviewWentWell ?? "", reviewTomorrow: plan.reviewTomorrow ?? "",
    tasks: plan.tasks.map((task) => ({ key: task.id, id: task.id, title: task.title, priority: task.priority, status: task.status })),
  };
}

export function emptyWeekEditor(weekStart: string): WeekEditor {
  return { id: null, version: null, weekStart, recurringUnfinished: "", issues: "", reflection: "", nextWeekChanges: "" };
}

export function editorFromWeek(week: DailyWeek): WeekEditor {
  return {
    id: week.id, version: week.version, weekStart: week.weekStart,
    recurringUnfinished: week.recurringUnfinished ?? "", issues: week.issues ?? "",
    reflection: week.reflection ?? "", nextWeekChanges: week.nextWeekChanges ?? "",
  };
}

function textLimit(value: string): string | null {
  return value.length > 4000 ? "Nội dung dài nhất là 4000 ký tự." : null;
}

export function planSaveBody(editor: PlanEditor): SaveReady<SaveDailyPlanBody> {
  if (editor.tasks.length > 50) return { ok: false, message: "Một ngày có tối đa 50 việc." };
  const limited = textLimit(editor.reviewReasons) ?? textLimit(editor.reviewWentWell) ?? textLimit(editor.reviewTomorrow);
  if (limited) return { ok: false, message: limited };
  const tasks: SaveDailyPlanBody["tasks"] = [];
  for (const task of editor.tasks) {
    const title = task.title.trim();
    if (title === "") return { ok: false, message: "Mỗi việc cần có tiêu đề." };
    if (title.length > 200) return { ok: false, message: "Tiêu đề việc dài nhất là 200 ký tự." };
    tasks.push(task.id ? { id: task.id, title, priority: task.priority, status: task.status } : { title, priority: task.priority, status: task.status });
  }
  return {
    ok: true,
    body: {
      expectedVersion: editor.version,
      reviewReasons: editor.reviewReasons,
      reviewWentWell: editor.reviewWentWell,
      reviewTomorrow: editor.reviewTomorrow,
      tasks,
    },
  };
}

export function weekSaveBody(editor: WeekEditor): SaveReady<SaveDailyWeekBody> {
  const limited = textLimit(editor.recurringUnfinished) ?? textLimit(editor.issues) ?? textLimit(editor.reflection) ?? textLimit(editor.nextWeekChanges);
  if (limited) return { ok: false, message: limited };
  return {
    ok: true,
    body: {
      expectedVersion: editor.version,
      recurringUnfinished: editor.recurringUnfinished,
      issues: editor.issues,
      reflection: editor.reflection,
      nextWeekChanges: editor.nextWeekChanges,
    },
  };
}

export function submitAllowed(state: { dirty: boolean; planId: string | null; busy: boolean }): boolean {
  return !state.dirty && state.planId !== null && !state.busy;
}

export function shouldApplyServerDaily(state: { dirty: boolean; conflict: boolean; busy?: boolean }): boolean {
  return !state.dirty && !state.conflict && state.busy !== true;
}

/** Formats the server week aggregate. It does not recompute rates or day counts. */
export function formatWeekSummary(week: Pick<DailyWeek, "plannedDays" | "weekDays" | "completionRate" | "mustCompleted" | "mustTotal" | "onTimeDays">): string {
  const rate = week.completionRate === null ? NOT_APPLICABLE_LABEL : `${percent(week.completionRate)}%`;
  const must = week.mustTotal === 0 ? NOT_APPLICABLE_LABEL : `${week.mustCompleted}/${week.mustTotal}`;
  return `Đã lập ${week.plannedDays}/${week.weekDays}. Mức hoàn thành ${rate}. Bắt buộc ${must}. Đúng hạn ${week.onTimeDays} ngày.`;
}

function percent(rate: number): string {
  const rounded = Math.round(rate * 1000) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
