import assert from "node:assert/strict";
import { it } from "node:test";
import { replaceListParam } from "../src/lib/list-navigation.ts";
import { replaceQuestionBankParam, isUuid } from "../src/features/questions/components/manual-question.ts";
import { parseToolkitDecimal } from "../src/features/toolkit/lib/decimal.ts";
import { calculateGpa } from "../src/features/toolkit/lib/gpa.ts";
import { calculateGpaGoal } from "../src/features/toolkit/lib/gpa-goal.ts";
import { hasUuidFormat } from "../src/lib/uuid.ts";
import { groupId } from "../src/features/daily/groups/group-contract.ts";
import { isPrivateAssetId } from "../src/features/exams/paper-figures.ts";
import { isPrivateFigureId } from "../src/features/questions/components/figure-resolution.ts";

it("list mutation clones, retains unrelated filters, resets only non-page changes and preserves explicit input", () => {
  const original = new URLSearchParams("year=2026&page=4&status=DRAFT&subject=old");
  const before = original.toString();
  const changed = replaceListParam(original, "subject", "vật lý & toán");
  assert.equal(original.toString(), before);
  assert.notEqual(changed, original);
  assert.equal(changed.get("subject"), "vật lý & toán");
  assert.equal(changed.get("year"), "2026");
  assert.equal(changed.get("status"), "DRAFT");
  assert.equal(changed.has("page"), false);
  assert.equal(replaceListParam(original, "subject", "").has("subject"), false);
  assert.equal(replaceListParam(original, "page", "2").get("subject"), "old");
  assert.equal(replaceListParam(original, "page", "").has("page"), false);
  assert.equal(replaceListParam(original, "subject", "  raw draft  ").get("subject"), "  raw draft  ");
  for (const key of ["search", "subjectId", "status", "page"] as const) {
    for (const value of ["", "2", "  raw  "]) {
      assert.equal(replaceQuestionBankParam(original, key, value).toString(), replaceListParam(original, key, value).toString());
    }
  }
});

it("both GPA consumers retain decimal syntax and distinct credit/range rules", () => {
  for (const [input, expected] of [[" 2,5 ", 2.5], [".5", .5], [",5", .5], ["1.", 1], ["0", 0]] as const) {
    assert.equal(parseToolkitDecimal(input), expected);
  }
  for (const input of ["", " ", "-1", "+1", "1e2", "1,2.3", "NaN", "Infinity", "1 000", "1" + "0".repeat(309)]) {
    assert.equal(parseToolkitDecimal(input), null);
    assert.equal(calculateGpa([{ id: "row", name: "Math", credits: input, grade: "3" }], 4).invalid, true);
    assert.equal(calculateGpaGoal({ currentGpa: "3", completedCredits: input, remainingCredits: "10", targetGpa: "3" }, 4).status, "invalid");
  }
  assert.equal(calculateGpa([{ id: "row", name: "Math", credits: "0", grade: "3" }], 4).invalid, true);
  assert.equal(calculateGpaGoal({ currentGpa: "0", completedCredits: "0", remainingCredits: "10", targetGpa: "3" }, 4).status, "achievable");
  assert.equal(calculateGpa([{ id: "row", name: "Math", credits: "2,5", grade: "3,5" }], 4).average, 3.5);
  assert.equal(calculateGpa([{ id: "row", name: "Math", credits: "2", grade: "4,1" }], 4).invalid, true);
});

it("shared UUID lexical predicate preserves domain wrappers without adding version or authority policy", () => {
  const valid = ["00000000-0000-0000-0000-000000000000", "ABCDEF12-1234-ABCD-0000-123456789ABC"];
  const invalid = ["", "00000000000000000000000000000000", "00000000-0000-0000-0000-00000000000g", " " + valid[0], valid[0] + " "];
  for (const value of [...valid, ...invalid]) {
    const expected = valid.includes(value);
    for (const predicate of [hasUuidFormat, isUuid, groupId, isPrivateAssetId, isPrivateFigureId]) assert.equal(predicate(value), expected);
  }
  for (const value of [null, undefined, {}, 7]) assert.equal(groupId(value), false);
});
