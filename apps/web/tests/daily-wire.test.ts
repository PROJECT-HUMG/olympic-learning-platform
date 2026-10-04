import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { ApiError } from "../src/lib/api-error.ts";
import {
  DAILY_CONTRACT,
  alignedDailyPlan,
  alignedDailyWeek,
  dailyErrorMessage,
  isDailyConflict,
  isMissingDailyPlan,
  readDailyPlan,
  readDailyWeek,
  requireDailyAccountDate,
  requireDailySubmitTarget,
  requireDailyWeekRequest,
} from "../src/features/daily/lib/daily-contract.ts";
import { dailyWeekAccountKey, dailyWeekKey } from "../src/features/daily/lib/daily-contract.ts";
import {
  beginDailyOperation,
  dailyDraftFailure,
  dailyLeaveBlocked,
  finishDailyOperation,
  idleDailyGate,
  isDailyAccountLeave,
  noteDailyEdit,
  resolveDailyAccountMount,
  shouldApplyCompletedFetch,
  shouldBlockDailyLeave,
} from "../src/features/daily/lib/daily-lifecycle.ts";
import {
  editorFromPlan,
  emptyPlanEditor,
  formatWeekSummary,
  planSaveBody,
  shouldApplyServerDaily,
  submitAllowed,
} from "../src/features/daily/lib/plan-editor.ts";

const OWNER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PLAN = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const TASK_A = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const TASK_B = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function task(overrides: Record<string, unknown> = {}) {
  return { id: TASK_A, title: "Đọc", priority: "MUST", status: "TODO", position: 0, ...overrides };
}

function planPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: PLAN,
    ownerId: OWNER,
    planDate: "2026-10-05",
    firstSubmittedAt: null,
    onTime: false,
    reviewReasons: "  lý do\n",
    reviewWentWell: null,
    reviewTomorrow: "mai",
    tasks: [task()],
    completedCount: 0,
    totalCount: 1,
    mustCompleted: 0,
    mustTotal: 1,
    createdAt: "2026-10-05T01:00:00+07:00",
    updatedAt: "2026-10-05T01:00:00Z",
    version: 0,
    ...overrides,
  };
}

function weekPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: null,
    weekStart: "2026-10-05",
    recurringUnfinished: "  còn dở\n",
    issues: null,
    reflection: null,
    nextWeekChanges: null,
    plannedDays: 0,
    weekDays: 7,
    nonemptyDays: 0,
    completionRate: null,
    mustCompleted: 0,
    mustTotal: 0,
    mustRate: null,
    onTimeDays: 0,
    version: null,
    ...overrides,
  };
}

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

it("rejects malformed plans and keeps a consistent task list", () => {
  const read = readDailyPlan(planPayload());
  assert.ok(read);
  assert.equal(read.reviewReasons, "  lý do\n");
  assert.equal(read.createdAt, "2026-10-05T01:00:00+07:00");
  assert.equal(read.updatedAt, "2026-10-05T01:00:00Z");
  assert.equal(readDailyPlan(planPayload({ version: "2" }))?.version, 2);
  assert.equal(readDailyPlan(planPayload({ version: "0" }))?.version, 0);
  assert.equal(readDailyPlan(planPayload({ tasks: [task({ status: "IN_PROGRESS" })] })), null);
  const missingReview = planPayload();
  delete missingReview.reviewReasons;
  assert.equal(readDailyPlan(missingReview), null);
  assert.equal(readDailyPlan(planPayload({ reviewWentWell: 1 })), null);
  assert.equal(readDailyPlan(planPayload({ planDate: "2026-02-31" })), null);
  assert.equal(readDailyPlan(planPayload({ createdAt: "2026-10-05T01:00:00" })), null);
  assert.equal(readDailyPlan(planPayload({ firstSubmittedAt: "2026-10-05T07:30:00" })), null);
  assert.equal(readDailyPlan(planPayload({ firstSubmittedAt: "2026-10-05T24:00:00Z" })), null);
  assert.equal(readDailyPlan(planPayload({ version: -1 })), null);
  assert.equal(readDailyPlan(planPayload({ version: 1.5 })), null);
  assert.equal(readDailyPlan(planPayload({ version: "01" })), null);
  assert.equal(readDailyPlan(planPayload({ version: Number.MAX_SAFE_INTEGER + 1 })), null);
  assert.equal(readDailyPlan(planPayload({ completedCount: 1 })), null);
  assert.equal(readDailyPlan(planPayload({ totalCount: 0 })), null);
  assert.equal(readDailyPlan(planPayload({ mustTotal: 0 })), null);
  assert.equal(readDailyPlan(planPayload({ mustCompleted: 1 })), null);
  assert.equal(readDailyPlan(planPayload({ tasks: [task({ position: 1 })] })), null);
  assert.equal(readDailyPlan(planPayload({
    tasks: [task(), task({ position: 1 })],
    totalCount: 2,
  })), null);
  const submitted = readDailyPlan(planPayload({ firstSubmittedAt: "2026-10-05T00:30:00.000Z", onTime: true }));
  assert.equal(submitted?.firstSubmittedAt, "2026-10-05T00:30:00.000Z");
  assert.equal(submitted?.onTime, true);
});

it("rejects inconsistent weeks and aligns the requested Monday", () => {
  const read = readDailyWeek(weekPayload());
  assert.ok(read);
  assert.equal(read.recurringUnfinished, "  còn dở\n");
  assert.equal(readDailyWeek(weekPayload({
    id: PLAN,
    version: "1",
    plannedDays: 1,
    nonemptyDays: 1,
    completionRate: "0.25",
    mustTotal: 2,
    mustCompleted: 1,
    mustRate: 0.5,
    onTimeDays: 1,
  }))?.completionRate, 0.25);
  assert.equal(readDailyWeek(weekPayload({ weekStart: "2026-10-04" })), null);
  assert.equal(readDailyWeek(weekPayload({ weekStart: "2026-02-31" })), null);
  assert.equal(readDailyWeek(weekPayload({ weekDays: 6 })), null);
  assert.equal(readDailyWeek(weekPayload({ plannedDays: 8 })), null);
  assert.equal(readDailyWeek(weekPayload({ plannedDays: 1, onTimeDays: 2 })), null);
  assert.equal(readDailyWeek(weekPayload({ mustTotal: 1, mustCompleted: 2, mustRate: 1, nonemptyDays: 0 })), null);
  assert.equal(readDailyWeek(weekPayload({ nonemptyDays: 0, completionRate: 0 })), null);
  assert.equal(readDailyWeek(weekPayload({ plannedDays: 1, nonemptyDays: 1, completionRate: null })), null);
  assert.equal(readDailyWeek(weekPayload({ plannedDays: 1, nonemptyDays: 1, completionRate: 1.1 })), null);
  assert.equal(readDailyWeek(weekPayload({ mustTotal: 0, mustRate: 0 })), null);
  assert.equal(readDailyWeek(weekPayload({ mustTotal: 1, mustCompleted: 1, mustRate: null, plannedDays: 1, nonemptyDays: 1, completionRate: 1 })), null);
  assert.equal(readDailyWeek(weekPayload({ id: PLAN, version: null })), null);
  assert.equal(readDailyWeek(weekPayload({ id: null, version: 0 })), null);
  assert.equal(readDailyWeek(weekPayload({ issues: 4 })), null);
  assert.equal(alignedDailyWeek(read, "2026-10-05"), read);
  assert.equal(alignedDailyWeek(read, "2026-10-04"), null);
  assert.equal(alignedDailyWeek(read, "2026-10-12"), null);
});

it("checks the account and civil date before treating a plan as aligned", () => {
  const read = readDailyPlan(planPayload());
  assert.ok(read);
  assert.equal(alignedDailyPlan(read, OWNER, "2026-10-05"), read);
  assert.equal(alignedDailyPlan(read, OTHER, "2026-10-05"), null);
  assert.equal(alignedDailyPlan(read, OWNER, "2026-10-06"), null);
  assert.equal(alignedDailyPlan(read, "not-a-uuid", "2026-10-05"), null);
  assert.equal(alignedDailyPlan(read, OWNER, "2026-02-31"), null);
  assert.doesNotThrow(() => requireDailyAccountDate(OWNER, "2026-10-05"));
  assert.throws(() => requireDailyAccountDate("not-a-uuid", "2026-10-05"), (error: unknown) => error instanceof Error && error.message === DAILY_CONTRACT);
  assert.throws(() => requireDailyAccountDate(OWNER, "2026-02-31"), (error: unknown) => error instanceof Error && error.message === DAILY_CONTRACT);
  assert.doesNotThrow(() => requireDailyWeekRequest(OWNER, "2026-10-05"));
  assert.throws(() => requireDailyWeekRequest(OWNER, "2026-10-04"), (error: unknown) => error instanceof Error && error.message === DAILY_CONTRACT);
  assert.throws(() => requireDailyWeekRequest("not-a-uuid", "2026-10-05"), (error: unknown) => error instanceof Error && error.message === DAILY_CONTRACT);
  assert.throws(() => requireDailySubmitTarget(OWNER, "2026-10-05", "plan"), (error: unknown) => error instanceof Error && error.message === DAILY_CONTRACT);
  assert.doesNotThrow(() => requireDailySubmitTarget(OWNER, "2026-10-05", PLAN));
});

it("builds the save body and gates submit plus server hydration", () => {
  const created = planSaveBody(emptyPlanEditor("2026-10-05"));
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.body.expectedVersion, null);
  assert.deepEqual(created.body.tasks, []);
  const stored = readDailyPlan(planPayload({
    tasks: [task(), task({ id: TASK_B, title: "Viết", priority: "COULD", status: "COMPLETED", position: 1 })],
    totalCount: 2,
    completedCount: 1,
  }));
  assert.ok(stored);
  const editor = editorFromPlan(stored);
  editor.tasks = [...editor.tasks, { key: "new", id: null, title: "  Mới  ", priority: "SHOULD", status: "TODO" }];
  editor.reviewReasons = "  giữ\n";
  const saved = planSaveBody(editor);
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal(saved.body.expectedVersion, 0);
  assert.equal(saved.body.reviewReasons, "  giữ\n");
  assert.deepEqual(saved.body.tasks[0], { id: TASK_A, title: "Đọc", priority: "MUST", status: "TODO" });
  assert.equal(saved.body.tasks[1].id, TASK_B);
  assert.deepEqual(saved.body.tasks[2], { title: "Mới", priority: "SHOULD", status: "TODO" });
  assert.equal("id" in saved.body.tasks[2], false);
  const removed = planSaveBody({ ...editor, tasks: editor.tasks.filter((item) => item.id === TASK_A) });
  assert.equal(removed.ok, true);
  if (!removed.ok) return;
  assert.deepEqual(removed.body.tasks.map((item) => item.id ?? null), [TASK_A]);
  const blank = planSaveBody({ ...editor, tasks: [{ key: "blank", id: null, title: "   ", priority: "SHOULD", status: "TODO" }] });
  assert.equal(blank.ok, false);
  const tooMany = planSaveBody({ ...emptyPlanEditor("2026-10-05"), tasks: Array.from({ length: 51 }, (_, index) => ({ key: String(index), id: null, title: "Việc", priority: "SHOULD" as const, status: "TODO" as const })) });
  assert.equal(tooMany.ok, false);
  assert.equal(submitAllowed({ dirty: true, planId: PLAN, busy: false }), false);
  assert.equal(submitAllowed({ dirty: false, planId: null, busy: false }), false);
  assert.equal(submitAllowed({ dirty: false, planId: PLAN, busy: true }), false);
  assert.equal(submitAllowed({ dirty: false, planId: PLAN, busy: false }), true);
  assert.equal(shouldApplyServerDaily({ dirty: true, conflict: false }), false);
  assert.equal(shouldApplyServerDaily({ dirty: false, conflict: true }), false);
  assert.equal(shouldApplyServerDaily({ dirty: false, conflict: false }), true);
  assert.equal(shouldApplyServerDaily({ dirty: false, conflict: false, busy: true }), false);
  assert.equal(shouldApplyServerDaily({ dirty: false, conflict: false, busy: false }), true);
  assert.equal(formatWeekSummary({ plannedDays: 3, weekDays: 7, completionRate: 0.25, mustCompleted: 1, mustTotal: 2, onTimeDays: 1 }), "Đã lập 3/7. Mức hoàn thành 25%. Bắt buộc 1/2. Đúng hạn 1 ngày.");
  assert.equal(formatWeekSummary({ plannedDays: 0, weekDays: 7, completionRate: null, mustCompleted: 0, mustTotal: 0, onTimeDays: 0 }), "Đã lập 0/7. Mức hoàn thành Không áp dụng. Bắt buộc Không áp dụng. Đúng hạn 0 ngày.");
  assert.equal(formatWeekSummary({ plannedDays: 3, weekDays: 7, completionRate: 0.25, mustCompleted: 1, mustTotal: 2, onTimeDays: 1 }).includes("nonempty"), false);
});

it("maps conflicts to the Vietnamese retain sentence", () => {
  const conflict = new ApiError({ status: 409, title: "Conflict", detail: "Reload the week before saving", messageKey: "error.resource.stateConflict" });
  assert.equal(isDailyConflict(conflict), true);
  assert.equal(isMissingDailyPlan(conflict), false);
  const message = dailyErrorMessage(conflict);
  assert.equal(message, "Bản trên máy chủ vừa đổi. Bản bạn đang nhập vẫn được giữ.");
  assert.equal(message.includes("Reload"), false);
  assert.equal(dailyErrorMessage(new ApiError({ status: 500, title: "Error", detail: "Something broke" })), "Không thực hiện được. Hãy thử lại.");
  assert.equal(dailyErrorMessage(new Error(DAILY_CONTRACT)), DAILY_CONTRACT);
  assert.equal(isMissingDailyPlan(new ApiError({ status: 404, title: "Missing" })), true);
  assert.equal(isMissingDailyPlan({ response: { status: 404 } }), true);
  assert.equal(isMissingDailyPlan(new ApiError({ messageKey: "error.resource.notFound", title: "Missing" })), true);
});

it("keeps the service boundary typed and the screens inside Daily", () => {
  const service = source("../src/features/daily/services/daily.service.ts");
  const hooks = source("../src/features/daily/hooks/use-daily.ts");
  const planEditor = source("../src/features/daily/components/daily-plan-editor.tsx");
  const weekEditor = source("../src/features/daily/components/daily-week-editor.tsx");
  const ownerPage = source("../src/pages/daily-owner-page.tsx");
  const weekPage = source("../src/pages/daily-week-page.tsx");
  assert.equal(service.includes("as never"), false);
  assert.equal(service.includes("&& false"), false);
  assert.equal(service.includes("/api/v1"), false);
  assert.equal(service.includes("alignedDailyPlan"), true);
  assert.equal(service.includes("alignedDailyWeek"), true);
  const getPlan = service.slice(service.indexOf("async getPlan"), service.indexOf("async savePlan"));
  const savePlan = service.slice(service.indexOf("async savePlan"), service.indexOf("async submitPlan"));
  const submit = service.slice(service.indexOf("async submitPlan"), service.indexOf("async getWeek"));
  const getWeek = service.slice(service.indexOf("async getWeek"), service.indexOf("async saveWeek"));
  assert.ok(getPlan.indexOf("requireDailyAccountDate") < getPlan.indexOf('apiClient.get("/daily/plans"'));
  assert.ok(getPlan.indexOf("if (error instanceof Error && error.message === DAILY_CONTRACT) throw error;") < getPlan.indexOf("isMissingDailyPlan"));
  assert.equal(savePlan.includes("isMissingDailyPlan"), false);
  assert.ok(savePlan.indexOf("requireDailyAccountDate") < savePlan.indexOf('apiClient.put("/daily/plans"'));
  assert.ok(submit.indexOf("requireDailySubmitTarget") < submit.indexOf("apiClient.post(`/daily/plans/${planId}/submit`)"));
  assert.ok(getWeek.indexOf("requireDailyWeekRequest") < getWeek.indexOf('apiClient.get("/daily/weeks"'));
  assert.ok(service.indexOf('apiClient.put("/daily/weeks"') > service.indexOf("requireDailyWeekRequest"));
  assert.equal(hooks.includes('user?.status === "ACTIVE"'), true);
  assert.equal(hooks.includes("enabled: Boolean(userId && date)"), true);
  assert.equal(hooks.includes("enabled: Boolean(userId && weekStart)"), true);
  assert.equal(hooks.includes("dailyPlanKey(userId, plan.planDate)"), true);
  assert.equal(hooks.includes("dailyWeekKey(userId, week.weekStart)"), true);
  assert.equal(hooks.includes("accessToken"), false);
  const session = source("../src/features/daily/hooks/use-daily-editor.ts");
  const accountGate = source("../src/features/daily/components/daily-account-gate.tsx");
  assert.equal(planEditor.includes("IN_PROGRESS"), false);
  assert.equal(planEditor.includes('priority: "SHOULD", status: "TODO"'), true);
  assert.equal(planEditor.includes("submitAllowed"), true);
  assert.equal(planEditor.includes("shouldApplyServerDaily"), true);
  assert.equal(planEditor.includes("dailyDraftFailure"), true);
  assert.equal(planEditor.includes("useDailyDraftLeave"), true);
  assert.equal(planEditor.includes("Hãy lưu hoặc tải lại trước khi đổi ngày."), true);
  assert.equal(planEditor.includes("Tải bản trên máy chủ"), true);
  assert.equal(planEditor.includes("<fieldset disabled={draft.busy}"), true);
  assert.equal(/if \(plan\.isError\)/.test(planEditor), false);
  const planSave = planEditor.slice(planEditor.indexOf("async function save"), planEditor.indexOf("async function submit"));
  assert.ok(planSave.indexOf('draft.begin("save")') < planSave.indexOf("mutateAsync"));
  assert.ok(planSave.indexOf('draft.finish("save"') < planSave.indexOf("setForm(editorFromPlan(saved))"));
  assert.ok(planEditor.indexOf('draft.begin("submit")') < planEditor.indexOf("submitPlan.mutateAsync"));
  assert.ok(planEditor.indexOf('draft.begin(operation)') < planEditor.indexOf("await plan.refetch()"));
  assert.equal(weekEditor.includes("weeklyFigures"), false);
  assert.equal(weekEditor.includes("nonemptyDays"), false);
  assert.equal(weekEditor.includes("formatWeekSummary"), true);
  assert.equal(weekEditor.includes("shouldApplyServerDaily"), true);
  assert.equal(weekEditor.includes("dailyDraftFailure"), true);
  assert.equal(weekEditor.includes("useDailyDraftLeave"), true);
  assert.equal(weekEditor.includes("Hãy lưu hoặc tải lại trước khi đổi ngày."), true);
  assert.equal(weekEditor.includes("<fieldset disabled={draft.busy}"), true);
  assert.equal(/if \(week\.isError\)/.test(weekEditor), false);
  const weekSave = weekEditor.slice(weekEditor.indexOf("async function save"), weekEditor.indexOf("const failure"));
  assert.ok(weekSave.indexOf('draft.begin("save")') < weekSave.indexOf("mutateAsync"));
  assert.ok(weekSave.indexOf('draft.finish("save"') < weekSave.indexOf("setForm(editorFromWeek(saved))"));
  assert.ok(weekEditor.indexOf('draft.begin(operation)') < weekEditor.indexOf("await week.refetch()"));
  assert.equal(session.includes("useBlocker"), true);
  assert.equal(session.includes("beforeunload"), true);
  assert.equal(session.includes("beginDailyOperation"), true);
  assert.equal(session.includes("isDailyAccountLeave"), true);
  assert.equal(session.includes("ROUTES.LOGIN"), true);
  assert.equal(session.includes("createBrowserRouter"), false);
  const planMutation = hooks.slice(hooks.indexOf("export function useSaveDailyPlan"), hooks.indexOf("export function useSubmitDailyPlan"));
  const submitMutation = hooks.slice(hooks.indexOf("export function useSubmitDailyPlan"), hooks.indexOf("export function useDailyWeek"));
  const weekMutation = hooks.slice(hooks.indexOf("export function useSaveDailyWeek"));
  assert.equal(planMutation.includes("dailyWeekAccountKey(userId)"), true);
  assert.equal(submitMutation.includes("dailyWeekAccountKey(userId)"), true);
  assert.equal(weekMutation.includes("invalidateQueries"), false);
  assert.equal(ownerPage.includes("export function DailyOwnerPage"), true);
  assert.equal(ownerPage.includes("parsePlatformDate"), true);
  assert.equal(ownerPage.includes("DailyAccountGate"), true);
  assert.equal(ownerPage.includes("${userId}:${date}"), true);
  assert.equal(ownerPage.includes("useBlocker"), false);
  assert.equal(weekPage.includes("export function DailyWeekPage"), true);
  assert.equal(weekPage.includes("weekStart"), true);
  assert.equal(weekPage.includes("DailyAccountGate"), true);
  assert.equal(weekPage.includes("${userId}:${weekStart}"), true);
  assert.equal(weekPage.includes("useBlocker"), false);
  assert.equal(ownerPage.includes("createBrowserRouter"), false);
  assert.equal(weekPage.includes("createBrowserRouter"), false);
  assert.equal(accountGate.includes("resolveDailyAccountMount"), true);
  assert.equal(accountGate.includes("Tài khoản chưa được mở."), true);
  assert.equal(accountGate.includes("Không tải lại được tài khoản."), true);
});

it("keeps one operation open and applies a server snapshot only at the captured revision", () => {
  const edited = noteDailyEdit(idleDailyGate());
  assert.ok(edited);
  assert.equal(edited.revision, 1);
  const started = beginDailyOperation(edited, "save");
  assert.ok(started);
  assert.equal(started.revision, 1);
  assert.equal(started.gate.operation, "save");
  assert.equal(beginDailyOperation(started.gate, "save"), null);
  assert.equal(beginDailyOperation(started.gate, "reload"), null);
  assert.equal(noteDailyEdit(started.gate), null);
  assert.equal(started.gate.revision, 1);
  const wrongOperation = finishDailyOperation(started.gate, "reload", started.revision, "apply");
  assert.equal(wrongOperation.unchanged, true);
  assert.equal(wrongOperation.apply, false);
  assert.deepEqual(wrongOperation.gate, started.gate);
  const kept = finishDailyOperation(started.gate, "save", started.revision, "keep");
  assert.equal(kept.unchanged, false);
  assert.equal(kept.apply, false);
  assert.deepEqual(kept.gate, { operation: "idle", revision: 1 });
  const reopened = beginDailyOperation(kept.gate, "save");
  assert.ok(reopened);
  const bumped = { operation: "save" as const, revision: reopened.revision + 1 };
  const stale = finishDailyOperation(bumped, "save", reopened.revision, "apply");
  assert.equal(stale.apply, false);
  assert.equal(stale.unchanged, false);
  assert.deepEqual(stale.gate, { operation: "idle", revision: bumped.revision });
  const current = beginDailyOperation(stale.gate, "submit");
  assert.ok(current);
  const applied = finishDailyOperation(current.gate, "submit", current.revision, "apply");
  assert.equal(applied.apply, true);
  assert.deepEqual(applied.gate, { operation: "idle", revision: current.revision });
});

it("blocks draft leave without holding an account exit, and keeps a ready draft on a later error", () => {
  assert.equal(shouldBlockDailyLeave({ dirty: true, conflict: false, busy: false, accountLeave: false, currentKey: "/daily?date=2026-10-05", nextKey: "/daily?date=2026-10-05" }), false);
  assert.equal(shouldBlockDailyLeave({ dirty: true, conflict: false, busy: false, accountLeave: false, currentKey: "/daily?date=2026-10-05", nextKey: "/daily?date=2026-10-06" }), true);
  assert.equal(shouldBlockDailyLeave({ dirty: false, conflict: true, busy: false, accountLeave: false, currentKey: "/daily?date=2026-10-05", nextKey: "/questions" }), true);
  assert.equal(shouldBlockDailyLeave({ dirty: false, conflict: false, busy: true, accountLeave: false, currentKey: "/daily/week?weekStart=2026-10-05", nextKey: "/daily?date=2026-10-05" }), true);
  assert.equal(shouldBlockDailyLeave({ dirty: false, conflict: false, busy: false, accountLeave: false, currentKey: "/daily?date=2026-10-05", nextKey: "/questions" }), false);
  assert.equal(shouldBlockDailyLeave({ dirty: true, conflict: true, busy: true, accountLeave: true, currentKey: "/daily?date=2026-10-05", nextKey: "/login" }), false);
  assert.equal(dailyLeaveBlocked({ dirty: true, conflict: false, busy: false, accountLeave: false }), true);
  assert.equal(isDailyAccountLeave("/login", ["/login", "/register"]), true);
  assert.equal(isDailyAccountLeave("/login/session", ["/login"]), true);
  assert.equal(isDailyAccountLeave("/daily", ["/login", "/register", "/verify-email", "/forgot-password", "/reset-password"]), false);
  assert.equal(shouldApplyCompletedFetch({ replace: true, dirty: true, conflict: true }), true);
  assert.equal(shouldApplyCompletedFetch({ replace: false, dirty: true, conflict: false }), false);
  assert.equal(shouldApplyCompletedFetch({ replace: false, dirty: false, conflict: true }), false);
  assert.equal(shouldApplyCompletedFetch({ replace: false, dirty: false, conflict: false }), true);
  assert.deepEqual(resolveDailyAccountMount({ pending: false, error: true, activeUserId: OWNER }), { phase: "editor", userId: OWNER, accountWarning: true });
  assert.deepEqual(resolveDailyAccountMount({ pending: false, error: false, activeUserId: OWNER }), { phase: "editor", userId: OWNER, accountWarning: false });
  assert.deepEqual(resolveDailyAccountMount({ pending: true, error: false, activeUserId: null }), { phase: "loading", userId: null, accountWarning: false });
  assert.deepEqual(resolveDailyAccountMount({ pending: false, error: true, activeUserId: null }), { phase: "error", userId: null, accountWarning: false });
  assert.deepEqual(resolveDailyAccountMount({ pending: false, error: false, activeUserId: null }), { phase: "inactive", userId: null, accountWarning: false });
  assert.equal(dailyDraftFailure({ ready: true, error: true }), "inline");
  assert.equal(dailyDraftFailure({ ready: true, error: false }), "form");
  assert.equal(dailyDraftFailure({ ready: false, error: true }), "initial");
  assert.equal(dailyDraftFailure({ ready: false, error: false }), "loading");
  assert.deepEqual(dailyWeekAccountKey(OWNER), ["daily", "week", OWNER]);
  assert.deepEqual(dailyWeekKey(OWNER, "2026-10-05").slice(0, 3), [...dailyWeekAccountKey(OWNER)]);
});
