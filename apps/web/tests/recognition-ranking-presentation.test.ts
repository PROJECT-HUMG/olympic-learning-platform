import assert from "node:assert/strict";
import { it } from "node:test";
import { presentRankingList, rankingContextLabel, scoreNameTone } from "../src/features/recognition/ranking-presentation-model.ts";

it("retains unique server ranks for equal points instead of recalculating ties", () => {
  const list = presentRankingList([
    { rank: 1, userId: "a", fullName: "An", totalPoints: 32, approvedCount: 2 },
    { rank: 2, userId: "b", fullName: "Bình", totalPoints: 32, approvedCount: 3 },
    { rank: 3, userId: "c", fullName: "Chi", totalPoints: 16, approvedCount: 1 },
  ], undefined, "/rankings");
  assert.deepEqual(list.rows.map(row => row.rank), [1, 2, 3]);
  assert.equal(list.rows[0].tone, list.rows[1].tone);
  assert.equal(list.rows[1].href, "/users/b");
});

it("name color depends only on actual points, never place or an inferred award", () => {
  assert.deepEqual([0, 19, 20, 49, 50, 500].map(scoreNameTone), ["neutral", "neutral", "blue", "blue", "teal", "teal"]);
  const list = presentRankingList([
    { rank: 1, userId: "a", fullName: "An", totalPoints: 16, approvedCount: 1 },
    { rank: 30, userId: "b", fullName: "Bình", totalPoints: 64, approvedCount: 5 },
  ], 2026, "/rankings?year=2026");
  assert.deepEqual(list.rows.map(row => row.tone), ["neutral", "teal"]);
  assert.equal(Object.hasOwn(list.rows[0], "badge"), false);
});

it("keeps full names, supplied totals and later-page ranks with the safe profile destination", () => {
  const name = "Nguyễn" + "A".repeat(80);
  const list = presentRankingList([
    { rank: 21, userId: "d/e", fullName: name, totalPoints: 18, approvedCount: 3 },
  ], 2024, "/rankings?year=2024&page=2");
  const row = list.rows[0];
  assert.equal(row.rank, 21);
  assert.equal(row.fullName, name);
  assert.equal(row.href, "/users/d%2Fe");
  assert.equal(row.accessibleRank, "Hạng 21, Năm 2024");
  assert.equal(row.approvedCount, 3);
  assert.equal(row.pointsLabel, "18 điểm nền tảng");
  assert.equal(list.from, "/rankings?year=2024&page=2");
});

it("preserves honest unknown timing without deriving it from names, ranks or points", () => {
  const list = presentRankingList([
    { rank: 1, userId: "a", fullName: "An", totalPoints: 16, approvedCount: 1, scoreTimingKnown: true },
    { rank: 2, userId: "b", fullName: "Bình", totalPoints: 16, approvedCount: 1, scoreTimingKnown: false },
    { rank: 3, userId: "c", fullName: "Chi", totalPoints: 16, approvedCount: 1 },
  ], undefined, "/rankings");
  assert.deepEqual(list.rows.map(row => row.scoreTimingKnown), [true, false, undefined]);
  assert.equal(Object.hasOwn(list.rows[0], "reviewedAt"), false);
});

it("keeps all-time/year context and return state even for empty results", () => {
  assert.equal(rankingContextLabel(undefined), "Tất cả thời gian");
  assert.equal(rankingContextLabel(Number.NaN), "Tất cả thời gian");
  assert.equal(rankingContextLabel(2023), "Năm 2023");
  const result = presentRankingList([], 2025, "/rankings?year=2025&page=3&keep=value");
  assert.deepEqual(result.rows, []);
  assert.equal(result.contextLabel, "Năm 2025");
  assert.equal(result.from, "/rankings?year=2025&page=3&keep=value");
});
