import assert from "node:assert/strict";
import { it } from "node:test";
import { advancePhaseFeedback, type PhaseFeedbackState, type PhaseStamp } from "../src/features/study-room/lib/phase-feedback.ts";

const empty: PhaseFeedbackState = { stamp: null, notifiedKey: null };
const focus: PhaseStamp = { roomId: "room", version: 0, phase: "FOCUS", session: 1, endsAt: 10_000, focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15 };

it("announces a local boundary once and does not repeat when polling catches up", () => {
  const initial = advancePhaseFeedback(empty, focus, 1000, true);
  assert.equal(initial.notice, null);
  const finished = advancePhaseFeedback(initial.state, focus, 10_000, true);
  assert.equal(finished.notice?.kind, "focus-complete");
  assert.equal(advancePhaseFeedback(finished.state, focus, 10_001, true).notice, null);
  const rest = { ...focus, phase: "BREAK" as const, endsAt: 15_000 };
  const caughtUp = advancePhaseFeedback(finished.state, rest, 10_010, true);
  assert.equal(caughtUp.notice, null);
  const ready = advancePhaseFeedback(caughtUp.state, rest, 15_000, true);
  assert.equal(ready.notice?.kind, "rest-complete");
  assert.equal(advancePhaseFeedback(ready.state, { ...focus, session: 2, endsAt: 40_000 }, 15_010, true).notice, null);
});

it("announces a fresh server transition if the local tick has not yet fired", () => {
  const initial = advancePhaseFeedback(empty, focus, 9000, true);
  const next = advancePhaseFeedback(initial.state, { ...focus, phase: "BREAK", endsAt: 15_000 }, 10_050, true);
  assert.equal(next.notice?.kind, "focus-complete");
});

it("does not replay expired boundaries on first entry, reconnection or long catch-up", () => {
  const late = advancePhaseFeedback(empty, focus, 10_050, true);
  assert.equal(late.notice, null);
  assert.equal(advancePhaseFeedback(late.state, focus, 10_100, true).notice, null);
  const initial = advancePhaseFeedback(empty, focus, 9000, true);
  const disconnected = advancePhaseFeedback(initial.state, focus, 10_000, false);
  assert.equal(advancePhaseFeedback(disconnected.state, focus, 10_100, true).notice, null);
  assert.equal(advancePhaseFeedback(initial.state, { ...focus, phase: "BREAK", endsAt: 40_000 }, 30_000, true).notice, null);
});

it("a restart or a new room establishes a baseline without a false completion", () => {
  const initial = advancePhaseFeedback(empty, focus, 9000, true);
  for (const restarted of [{ ...focus, version: 1, endsAt: 50_000 }, { ...focus, roomId: "other", endsAt: 50_000 }]) {
    const next = advancePhaseFeedback(initial.state, restarted, 10_000, true);
    assert.equal(next.notice, null);
    assert.equal(advancePhaseFeedback(next.state, restarted, 50_000, true).notice?.kind, "focus-complete");
  }
});

it("allows a future boundary after recovering before its deadline and respects long rest", () => {
  const fourth = { ...focus, session: 4, longBreakMinutes: 20 };
  const disconnected = advancePhaseFeedback(empty, fourth, 1000, false);
  const recovered = advancePhaseFeedback(disconnected.state, fourth, 5000, true);
  assert.equal(recovered.notice, null);
  assert.match(advancePhaseFeedback(recovered.state, fourth, 10_000, true).notice!.description, /20 phút/);
  const longRest = { ...fourth, phase: "LONG_BREAK" as const, endsAt: 20_000 };
  const rest = advancePhaseFeedback(empty, longRest, 15_000, true);
  assert.equal(advancePhaseFeedback(rest.state, longRest, 20_000, true).notice?.kind, "rest-complete");
});
