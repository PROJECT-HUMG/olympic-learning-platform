import assert from "node:assert/strict";
import { it } from "node:test";
import { calculateGpaGoal, restoreGpaGoal } from "../src/features/toolkit/lib/gpa-goal.ts";

function input(currentGpa = "2.8", completedCredits = "60", remainingCredits = "20", targetGpa = "3") {
  return { currentGpa, completedCredits, remainingCredits, targetGpa };
}

it("computes the required average and maximum attainable GPA with credit weighting", () => {
  const result = calculateGpaGoal(input(), 4);
  assert.equal(result.status, "achievable");
  assert.ok(Math.abs(result.requiredAverage! - 3.6) < 1e-12);
  assert.ok(Math.abs(result.maximumGpa! - 3.1) < 1e-12);
  assert.equal(calculateGpaGoal(input("8,0", "60", "20", "8,5"), 10).requiredAverage, 10);
});

it("identifies unattainable goals and handles completed or not-yet-started study", () => {
  assert.equal(calculateGpaGoal(input("2", "100", "10", "4"), 4).status, "unreachable");
  assert.equal(calculateGpaGoal(input("3", "60", "0", "3"), 4).status, "achieved");
  assert.equal(calculateGpaGoal(input("2", "60", "0", "3"), 4).status, "unreachable");
  assert.equal(calculateGpaGoal(input("0", "0", "20", "3"), 4).requiredAverage, 3);
  assert.equal(calculateGpaGoal(input("4", "100", "1", "1"), 4).requiredAverage, 0);
});

it("validates incomplete, negative, out-of-scale and ambiguous inputs without a partial result", () => {
  for (const value of ["", "-1", "Infinity", "1e2", "1,2.3", "1 000"]) {
    const result = calculateGpaGoal(input("3", value), 4);
    assert.equal(result.status, "invalid");
    assert.equal(result.requiredAverage, null);
  }
  assert.equal(calculateGpaGoal(input("4.01"), 4).status, "invalid");
  assert.equal(calculateGpaGoal(input("3", "0", "0"), 4).status, "invalid");
  assert.equal(calculateGpaGoal(restoreGpaGoal(null), 4).status, "empty");
});

it("does not expose NaN or infinite results for extreme ratios or overflowing credits", () => {
  const huge = `1${"0".repeat(308)}`;
  assert.equal(calculateGpaGoal(input("3", huge, "0.1", "3"), 4).requiredAverage, 3);
  assert.equal(calculateGpaGoal(input("3", huge, "0.1", "4"), 4).status, "unreachable");
  assert.equal(calculateGpaGoal(input("3", huge, huge), 4).status, "invalid");
});

it("restores valid partial drafts and rejects malformed local storage", () => {
  const partial = input("", "60", "", "3");
  assert.deepEqual(restoreGpaGoal(partial), partial);
  for (const value of [null, "wrong", { currentGpa: 3 }, { ...partial, remainingCredits: 20 }]) {
    assert.equal(calculateGpaGoal(restoreGpaGoal(value), 4).status, "empty");
  }
});
