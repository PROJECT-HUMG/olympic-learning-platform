import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { dailyFigures, weeklyFigures } from "../src/features/daily/lib/completion-figures.ts";
import { classifyFirstSubmit, firstSubmitCutoffEpoch, parsePlatformDate, platformDate, platformDateKey, weekDates, PLATFORM_TIME_ZONE } from "../src/features/daily/lib/platform-calendar.ts";
import { PRIORITY_LABEL, STATUS_LABEL, SUBMIT_TIMING_LABEL, NOT_APPLICABLE_LABEL, feedbackContributors, formatMust, formatOverall, formatPlannedDays, plainOwnerText } from "../src/features/daily/lib/review-display.ts";

const AN = "11111111-1111-4111-8111-111111111111";
const BINH = "22222222-2222-4222-8222-222222222222";
const CHI = "33333333-3333-4333-8333-333333333333";

it("uses the Asia/Ho_Chi_Minh civil date and a Monday week", () => {
  const calendar = readFileSync(new URL("../src/features/daily/lib/platform-calendar.ts", import.meta.url), "utf8");
  assert.equal(calendar.includes(".getFullYear"), false);
  assert.equal(calendar.includes(".getDate("), false);
  assert.equal(calendar.includes(".getDay("), false);
  assert.equal(calendar.includes("getTimezoneOffset"), false);
  assert.equal(PLATFORM_TIME_ZONE, "Asia/Ho_Chi_Minh");
  assert.deepEqual(platformDate("2026-10-04T16:59:59.999Z"), { year: 2026, month: 10, day: 4 });
  assert.deepEqual(platformDate("2026-10-04T17:00:00.000Z"), { year: 2026, month: 10, day: 5 });
  assert.equal(platformDate("not-a-date"), null);
  assert.equal(parsePlatformDate("2026-02-31"), null);
  const sunday = parsePlatformDate("2026-10-04");
  const monday = parsePlatformDate("2026-10-05");
  assert.ok(sunday && monday);
  assert.deepEqual(weekDates(sunday).map(platformDateKey), ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
  assert.equal(platformDateKey(weekDates(monday)[0]), "2026-10-05");
  assert.equal(platformDateKey(weekDates(monday)[6]), "2026-10-11");
});

it("classifies the first 07:30 submission without a configurable deadline", () => {
  const plan = parsePlatformDate("2026-10-05");
  assert.ok(plan);
  assert.equal(firstSubmitCutoffEpoch(plan), Date.parse("2026-10-05T07:30:00+07:00"));
  assert.deepEqual(classifyFirstSubmit(plan, "2026-10-05T07:30:00+07:00"), { timing: "ON_TIME", usable: true });
  assert.deepEqual(classifyFirstSubmit(plan, "2026-10-05T00:30:00.000Z"), { timing: "ON_TIME", usable: true });
  assert.deepEqual(classifyFirstSubmit(plan, "2026-10-05T07:30:00.001+07:00"), { timing: "LATE", usable: true });
  assert.deepEqual(classifyFirstSubmit(plan, null), { timing: "UNSUBMITTED", usable: true });
  assert.equal(SUBMIT_TIMING_LABEL.ON_TIME, "Đúng hạn");
  assert.equal(SUBMIT_TIMING_LABEL.LATE, "Muộn");
});

it("keeps daily overall separate from pooled weekly MUST", () => {
  const tasks = [
    { priority: "MUST" as const, status: "COMPLETED" as const },
    { priority: "MUST" as const, status: "TODO" as const },
    { priority: "SHOULD" as const, status: "COMPLETED" as const },
    { priority: "COULD" as const, status: "IN_PROGRESS" as const },
  ];
  const daily = dailyFigures(tasks);
  assert.deepEqual(daily.overall, { completed: 2, total: 4, rate: 0.5 });
  assert.deepEqual(daily.must, { completed: 1, total: 2, rate: 0.5 });
  assert.equal(formatOverall(daily.overall), "2/4");
  assert.equal(formatMust(daily.must), "1/2");
  const week = weeklyFigures([
    [{ priority: "MUST", status: "COMPLETED" }, { priority: "SHOULD", status: "TODO" }],
    [],
    [{ priority: "MUST", status: "TODO" }],
    null,
  ]);
  assert.equal(week.plannedDays, 3);
  assert.equal(week.weekLength, 7);
  assert.equal(week.averageRate, 0.25);
  assert.deepEqual(week.must, { completed: 1, total: 2, rate: 0.5 });
  assert.equal(formatPlannedDays(week.plannedDays), "3/7");
  const noMust = weeklyFigures([[{ priority: "SHOULD", status: "COMPLETED" }]]);
  assert.equal(noMust.averageRate, 1);
  assert.equal(noMust.must.rate, null);
  assert.equal(formatMust(noMust.must), NOT_APPLICABLE_LABEL);
  assert.equal(PRIORITY_LABEL.MUST, "Bắt buộc");
  assert.equal(PRIORITY_LABEL.SHOULD, "Nên làm");
  assert.equal(PRIORITY_LABEL.COULD, "Có thể làm");
  assert.equal(STATUS_LABEL.TODO, "Chưa làm");
  assert.equal(STATUS_LABEL.COMPLETED, "Đã xong");
});

it("preserves owner text and counts distinct identified contributors", () => {
  const issues = "Việc còn dở\n  hai khoảng trắng";
  assert.equal(plainOwnerText(issues), issues);
  assert.equal(plainOwnerText("<b>không render</b>\n"), "<b>không render</b>\n");
  const shown = feedbackContributors([
    { authorId: AN, authorName: "An", reviewId: "review", groupId: "group", text: "bản cũ" },
    { authorId: AN, authorName: "An", reviewId: "review", groupId: "group", text: "Sửa\n  giữ" },
    { authorId: BINH, authorName: "Bình", reviewId: "review", groupId: "group", text: "Góp ý\n  giữ dòng" },
    { authorId: BINH, authorName: "Bình", reviewId: "review", groupId: "other", text: "nhóm khác" },
    { authorId: CHI, authorName: "Chi", reviewId: "review", groupId: "group", text: "\n" },
    { authorId: "hidden", authorName: "Ẩn", reviewId: "review", groupId: "group", text: "không danh" },
    { authorId: AN, authorName: "   ", reviewId: "review", groupId: "group", text: "thiếu tên" },
    { authorId: BINH, authorName: "Bình", reviewId: "review", groupId: "group", text: "  \n" },
  ], "review", "group");
  assert.equal(shown.distinctCount, 2);
  assert.deepEqual(shown.contributors.map((person) => person.authorId), [AN, BINH]);
  assert.equal(shown.contributors[0].text, "Sửa\n  giữ");
  assert.equal(shown.contributors[1].text, "Góp ý\n  giữ dòng");
  const none = feedbackContributors([
    { authorId: AN, authorName: "An", reviewId: "review", groupId: "group", text: "\n" },
    { authorId: BINH, authorName: "Bình", reviewId: "review", groupId: "group", text: "   " },
  ], "review", "group");
  assert.equal(none.distinctCount, 0);
  assert.deepEqual(none.contributors, []);
});
