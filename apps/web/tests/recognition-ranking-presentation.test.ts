import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  presentRankingList,
  rankingContextLabel,
  rankTone,
} from "../src/features/recognition/ranking-presentation-model.ts";

const root = dirname(fileURLToPath(import.meta.url));
const medalWords = /medal|huy chương|huy chuong|HCV|HCB|HCĐ/i;

it("gives tied server ranks the same place and does not renumber by index", () => {
  const list = presentRankingList([
    { rank: 1, userId: "a", fullName: "An", totalPoints: 20, approvedCount: 2 },
    { rank: 1, userId: "b", fullName: "Bình", totalPoints: 20, approvedCount: 1 },
    { rank: 3, userId: "c", fullName: "Chi", totalPoints: 19, approvedCount: 4 },
  ], undefined, "/rankings");

  assert.deepEqual(list.rows.map((row) => [row.rank, row.tone]), [
    [1, "gold"],
    [1, "gold"],
    [3, "bronze"],
  ]);
  assert.equal(list.rows[1].tone, list.rows[0].tone);
  assert.equal(list.rows[1].href, "/achievements/b");
  assert.notEqual(list.rows[1].tone, "silver");
});

it("follows server rank when the visible order is not 1 then 2 then 3", () => {
  const list = presentRankingList([
    { rank: 3, userId: "c", fullName: "Chi", totalPoints: 9, approvedCount: 1 },
    { rank: 1, userId: "a", fullName: "An", totalPoints: 0, approvedCount: 0 },
    { rank: 1, userId: "b", fullName: "Bình", totalPoints: 40, approvedCount: 8 },
  ], 2024, "/rankings?year=2024");

  assert.deepEqual(list.rows.map((row) => row.tone), ["bronze", "gold", "gold"]);
  assert.equal(list.rows[0].totalPoints, 9);
  assert.equal(list.rows[1].approvedCount, 0);
  assert.equal(list.rows[1].pointsLabel, "0 điểm nền tảng");
});

it("keeps a later page on its server rank instead of treating the first row as first place", () => {
  const name = `Nguyễn${"A".repeat(80)}`;
  const list = presentRankingList([
    { rank: 4, userId: "d/e", fullName: name, totalPoints: 18, approvedCount: 3, username: "secret-user" },
  ], 2024, "/rankings?year=2024&page=2");

  assert.equal(list.contextLabel, "Năm 2024");
  assert.equal(list.from, "/rankings?year=2024&page=2");
  assert.equal(list.rows[0].rank, 4);
  assert.equal(list.rows[0].tone, "neutral");
  assert.equal(list.rows[0].fullName, name);
  assert.equal(list.rows[0].href, "/achievements/d%2Fe");
  assert.equal(list.rows[0].accessibleRank, "Hạng 4, Năm 2024");
  assert.equal(list.rows[0].approvedLabel, "3 thành tích đã duyệt");
  assert.equal(list.rows[0].pointsLabel, "18 điểm nền tảng");
  assert.equal(JSON.stringify(list).includes("secret-user"), false);
  assert.equal(Object.hasOwn(list.rows[0], "badge"), false);
});

it("names the selected year or all-time context without medal language", () => {
  assert.equal(rankingContextLabel(undefined), "Tất cả thời gian");
  assert.equal(rankingContextLabel(Number.NaN), "Tất cả thời gian");
  assert.equal(rankingContextLabel(2023), "Năm 2023");
  assert.equal(rankTone(1), "gold");
  assert.equal(rankTone(2), "silver");
  assert.equal(rankTone(3), "bronze");
  assert.equal(rankTone(4), "neutral");

  const allTime = presentRankingList([
    { rank: 2, userId: "e", fullName: "Em", totalPoints: 5, approvedCount: 1 },
  ], undefined, "/rankings");
  const year = presentRankingList(allTime.rows, 2020, "/rankings?year=2020");

  assert.equal(allTime.contextLabel, "Tất cả thời gian");
  assert.equal(allTime.rows[0].accessibleRank, "Hạng 2, Tất cả thời gian");
  assert.equal(year.contextLabel, "Năm 2020");
  assert.equal(year.rows[0].accessibleRank, "Hạng 2, Năm 2020");
  for (const text of [
    allTime.contextLabel,
    year.contextLabel,
    allTime.rows[0].accessibleRank,
    allTime.rows[0].approvedLabel,
    allTime.rows[0].pointsLabel,
  ]) {
    assert.doesNotMatch(text, medalWords);
  }
});

it("keeps the rank presentation files free of profile lookup and fixed name heights", () => {
  const model = readFileSync(join(root, "../src/features/recognition/ranking-presentation-model.ts"), "utf8");
  const view = readFileSync(join(root, "../src/features/recognition/ranking-presentation.tsx"), "utf8");
  const css = readFileSync(join(root, "../src/features/recognition/ranking-presentation.css"), "utf8");
  const narrow = css.slice(css.indexOf("max-width: 400px"));

  assert.doesNotMatch(model, /from ["']react|from ["']\.\/service|from ["']\.\/scoring|fetch\(/);
  assert.match(view, /presentRankingList/);
  assert.match(view, /ranking-presentation\.css/);
  assert.match(view, /data-tone=\{row\.tone\}/);
  assert.match(view, /aria-hidden="true"/);
  assert.match(view, /state=\{\{ from: presentation\.from \}\}/);
  assert.doesNotMatch(view, /recognitionService|useQuery|achievement-presentation|from ["']\.\/service|from ["']\.\/scoring|from ["']\.\/hooks|fetch\(/);
  for (const color of ["#795600", "#fff3cf", "#46576b", "#eaf0f5", "#82452b", "#f9e8dd"]) {
    assert.match(css, new RegExp(color));
  }
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.ranking-presentation__identity a\s*\{[^}]*overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(css, /line-clamp|max-height/);
  assert.match(narrow, /ranking-presentation__points/);
  assert.match(narrow, /text-align:\s*left/);
});
