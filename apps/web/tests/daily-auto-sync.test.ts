import assert from "node:assert/strict";
import { it } from "node:test";
import { beginDailyOperation, finishDailyOperation, idleDailyGate, noteDailyEdit } from "../src/features/daily/lib/daily-lifecycle.ts";
import { emptyPlanEditor, emptyWeekEditor, rebaseSyncedPlan, rebaseSyncedWeek, submitAllowed } from "../src/features/daily/lib/plan-editor.ts";
import type { DailyPlan, DailyWeek } from "../src/features/daily/lib/daily-contract.ts";

it("serializes auto-sync but accepts newer edits, so a stale batch cannot clear dirty", () => {
  const edit = noteDailyEdit(idleDailyGate())!;
  const started = beginDailyOperation(edit, "autosync")!;
  const newer = noteDailyEdit(started.gate)!;
  assert.equal(newer.operation, "autosync");
  assert.equal(beginDailyOperation(newer, "save"), null);
  assert.equal(beginDailyOperation(newer, "submit"), null);
  const done = finishDailyOperation(newer, "autosync", started.revision, "apply");
  assert.equal(done.apply, false);
  assert.equal(done.gate.operation, "idle");
  const next = beginDailyOperation(done.gate, "autosync")!;
  assert.equal(finishDailyOperation(next.gate, "autosync", next.revision, "apply").apply, true);
  assert.equal(noteDailyEdit(beginDailyOperation(done.gate, "submit")!.gate), null);
});

it("acknowledges a saved plan version without restoring later removed/reordered tasks or reflection", () => {
  const current = { ...emptyPlanEditor("2026-10-06"), reviewTomorrow: "Still typing", tasks: [{ key: "b", id: "b", title: "Newer title", priority: "MUST" as const, status: "COMPLETED" as const }] };
  const saved = { id: "plan", planDate: current.planDate, version: 4, firstSubmittedAt: null, onTime: false, tasks: [], reviewTomorrow: "Old" } as unknown as DailyPlan;
  const next = rebaseSyncedPlan(current, saved);
  assert.equal(next.version, 4); assert.equal(next.id, "plan");
  assert.equal(next.tasks, current.tasks); assert.equal(next.reviewTomorrow, current.reviewTomorrow);
  assert.throws(() => rebaseSyncedPlan(current, { ...saved, planDate: "2026-10-07" }));
  assert.throws(() => rebaseSyncedPlan({ ...current, id: "different" }, saved));
});

it("rebases weekly metadata only, and explicit empty Submit is distinct from routine persistence", () => {
  const current = { ...emptyWeekEditor("2026-10-05"), reflection: "Later edit" };
  const saved = { ...current, id: "week", version: 8, reflection: "Earlier edit" } as DailyWeek;
  assert.deepEqual(rebaseSyncedWeek(current, saved), { ...current, id: "week", version: 8 });
  assert.throws(() => rebaseSyncedWeek(current, { ...saved, weekStart: "2026-10-12" }));
  assert.equal(submitAllowed({ dirty: false, planId: null, busy: false, allowEmpty: true }), true);
  assert.equal(submitAllowed({ dirty: true, planId: null, busy: false, allowEmpty: true }), false);
});
