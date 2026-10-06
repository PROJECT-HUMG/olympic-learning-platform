import assert from "node:assert/strict";
import { it } from "node:test";
import { emptyPlanEditor, rebaseAddedTask } from "../src/features/daily/lib/plan-editor.ts";
import { evidenceRaster, evidenceIsImage } from "../src/features/daily/evidence/evidence-preview.ts";
import type { DailyPlan } from "../src/features/daily/lib/daily-contract.ts";

it("an append rebases identity/version but never overwrites local task edits/order/deletion or reflection", () => {
  const local = { ...emptyPlanEditor("2026-10-06"), reviewTomorrow: "Unsaved tomorrow", tasks: [{ key: "old", id: "old", title: "Local edit", priority: "MUST" as const, status: "TODO" as const }] };
  const saved = { id: "plan", planDate: local.planDate, version: 3, firstSubmittedAt: null, onTime: false, reviewTomorrow: "Server", tasks: [{ id: "old", title: "Saved old", priority: "MUST", status: "COMPLETED", position: 0 }, { id: "new", title: "Persisted addition", priority: "COULD", status: "TODO", position: 1 }] } as DailyPlan;
  const next = rebaseAddedTask(local, saved, "new");
  assert.equal(next.reviewTomorrow, local.reviewTomorrow);
  assert.deepEqual(next.tasks[0], local.tasks[0]);
  assert.equal(next.tasks[1].id, "new"); assert.equal(next.version, 3);
  assert.equal(rebaseAddedTask(next, saved, "new").tasks.length, 2);
  assert.equal(rebaseAddedTask({ ...local, tasks: [] }, saved, "new").tasks.length, 1, "Do not restore a locally removed task");
  assert.throws(() => rebaseAddedTask(local, saved, "not-returned"));
});

it("preview selection never treats document/SVG/HTML MIME as a safe image", () => {
  assert.equal(evidenceIsImage("image/svg+xml"), false);
  assert.equal(evidenceIsImage("application/pdf"), false);
  assert.equal(evidenceRaster(new TextEncoder().encode('<svg onload="alert(1)"></svg>')), null);
  assert.equal(evidenceRaster(new Uint8Array([255, 216, 0, 0])), null);
});

it("PNG dimensions are bounded before decoding, and malformed/truncated headers fail closed", () => {
  const bytes = new Uint8Array(33);bytes.set([137,80,78,71,13,10,26,10]);bytes.set(new TextEncoder().encode("IHDR"),12);
  const view = new DataView(bytes.buffer);view.setUint32(16,800);view.setUint32(20,600);
  assert.equal(evidenceRaster(bytes),"image/png");
  view.setUint32(16,8001);assert.equal(evidenceRaster(bytes),null);
  view.setUint32(16,8000);view.setUint32(20,8000);assert.equal(evidenceRaster(bytes),null);
  assert.equal(evidenceRaster(bytes.slice(0,24)),null);
});
