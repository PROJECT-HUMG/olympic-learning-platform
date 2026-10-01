import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateGpa, newCourse, restoreGpa, type CourseRow } from "../src/features/toolkit/lib/gpa.ts";

function course(id: string, credits: string, grade: string, name = ""): CourseRow {
  return { id, name, credits, grade };
}

function assertFreshGpa(value: unknown) {
  const state = restoreGpa(value);
  assert.equal(state.scale, 4);
  assert.equal(state.courses.length, 2);
  assert.equal(new Set(state.courses.map((row) => row.id)).size, 2);
  for (const row of state.courses) {
    assert.equal(typeof row.id, "string");
    assert.ok(row.id.length > 0);
    assert.equal(row.name, "");
    assert.equal(row.credits, "");
    assert.equal(row.grade, "");
  }
}

describe("GPA calculation", () => {
  it("weights grades by credits instead of averaging the rows", () => {
    const result = calculateGpa([course("a", "3", "4"), course("b", "1", "2")], 4);
    assert.equal(result.average, 3.5);
    assert.equal(result.totalCredits, 4);
    assert.equal(result.courseCount, 2);
    assert.equal(result.invalid, false);
  });

  it("includes a zero grade in both the weighted score and total credits", () => {
    const result = calculateGpa([course("a", "3", "4"), course("b", "1", "0")], 4);
    assert.equal(result.average, 3);
    assert.equal(result.totalCredits, 4);
    assert.equal(result.courseCount, 2);
    assert.equal(calculateGpa([course("zero", "2", "0")], 10).average, 0);
  });

  it("accepts decimal commas, decimal dots and whitespace on both scales", () => {
    const four = calculateGpa([course("a", " 2,5 ", " 3,5 "), course("b", ".5", "2.5")], 4);
    assert.ok(Math.abs(four.average! - 10 / 3) < 1e-12);
    assert.equal(four.totalCredits, 3);
    assert.equal(four.invalid, false);
    const ten = calculateGpa([course("a", "2", "8,5"), course("b", "2", "9.5")], 10);
    assert.equal(ten.average, 9);
    assert.equal(ten.invalid, false);
  });

  it("ignores completely blank rows and returns no average for an empty worksheet", () => {
    const blank = course("blank", "  ", "", "\t");
    const empty = calculateGpa([blank], 4);
    assert.equal(empty.average, null);
    assert.equal(empty.courseCount, 0);
    assert.equal(empty.totalCredits, 0);
    assert.equal(empty.invalid, false);
    assert.equal(calculateGpa([blank, course("filled", "2", "3")], 4).average, 3);
  });

  it("refuses a partial average when a named or partly filled row is incomplete", () => {
    for (const partial of [course("partial", "", "", "Giải tích"), course("partial", "2", ""), course("partial", "", "3")]) {
      const result = calculateGpa([course("valid", "2", "4"), partial], 4);
      assert.equal(result.invalid, true);
      assert.equal(result.average, null);
      assert.ok(result.errors.partial);
    }
  });

  it("rejects zero/negative credits and grades outside the selected scale", () => {
    for (const credits of ["0", "0,0", "-1"]) {
      const result = calculateGpa([course("bad", credits, "3")], 4);
      assert.equal(result.invalid, true);
      assert.ok(result.errors.bad.credits);
    }
    for (const [scale, grade] of [[4, "4.01"], [4, "-0.1"], [10, "10.01"]] as const) {
      const result = calculateGpa([course("bad", "2", grade)], scale);
      assert.equal(result.average, null);
      assert.ok(result.errors.bad.grade);
    }
    assert.equal(calculateGpa([course("edge", "2", "10")], 10).average, 10);
  });

  it("rejects ambiguous or non-decimal numbers instead of silently coercing them", () => {
    for (const value of ["1e2", "0x10", "Infinity", "NaN", "1,2.3", "1 000", "+2", ".", ","]) {
      const creditResult = calculateGpa([course("bad", value, "3")], 4);
      const gradeResult = calculateGpa([course("bad", "2", value)], 4);
      assert.equal(creditResult.invalid, true, `credits=${value}`);
      assert.equal(gradeResult.invalid, true, `grade=${value}`);
    }
  });

  it("does not expose an infinite or NaN average when accumulated values overflow", () => {
    const huge = `1${"0".repeat(308)}`;
    const result = calculateGpa([course("a", huge, "4"), course("b", huge, "4")], 4);
    assert.equal(result.invalid, true);
    assert.equal(result.average, null);
  });

  it("treats special persisted IDs as row keys, not object prototype properties", () => {
    const result = calculateGpa([course("valid", "2", "4"), course("__proto__", "", "3")], 4);
    assert.equal(result.invalid, true);
    assert.equal(result.average, null);
    assert.equal(Object.hasOwn(result.errors, "__proto__"), true);
    assert.ok(result.errors["__proto__"].credits);
  });
});

describe("GPA local-state restoration", () => {
  it("preserves valid drafts, including partially completed rows", () => {
    const saved = { scale: 10 as const, courses: [course("a", "3", "8.5", "Vật lý"), course("b", "", "", "Giải tích")] };
    assert.deepEqual(restoreGpa(saved), saved);
  });

  it("starts safely from malformed or incompatible saved state", () => {
    for (const value of [null, undefined, false, 3, "saved", [], {}, { scale: 5, courses: [newCourse()] }, { scale: "4", courses: [newCourse()] }, { scale: 4, courses: [] }, { scale: 4, courses: {} }, { scale: 4, courses: [null] }, { scale: 4, courses: [{ id: "a", name: "", credits: 3, grade: "4" }] }, { scale: 4, courses: [{ id: "a", name: "", credits: "3" }] }, { scale: 4, courses: [course("", "3", "4")] }]) {
      assertFreshGpa(value);
    }
  });

  it("rejects duplicate row IDs rather than merging their errors or React state", () => {
    assertFreshGpa({ scale: 10, courses: [course("duplicate", "3", "8"), course("duplicate", "2", "9")] });
  });
});
