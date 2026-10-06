import assert from "node:assert/strict";
import { it } from "node:test";
import { plannedWeekKeys, calendarWeekKeys } from "../src/features/daily/lib/calendar-presentation.ts";
import { dailyEntryDate, calendarMonthDates, shiftCalendarMonth } from "../src/features/daily/lib/date-selection.ts";

it("saved history never inserts a selected or current calendar week", () => {
  assert.deepEqual(plannedWeekKeys([]), []);
  assert.deepEqual(plannedWeekKeys(["2026-09-22", "2026-09-21", "2026-09-14", "bad"]), ["2026-09-21", "2026-09-14"]);
});

it("only absence defaults to the captured platform today", () => {
  assert.equal(dailyEntryDate(null, "2026-10-05"), "2026-10-05");
  assert.equal(dailyEntryDate("2026-09-30", "2026-10-05"), "2026-09-30");
  assert.equal(dailyEntryDate("", "2026-10-05"), "");
  assert.equal(dailyEntryDate("bad", "2026-10-05"), "bad");
});
it("calendar month uses complete Monday-first weeks and clamps month shifts", () => {
  const dates = calendarMonthDates("2026-10-05");
  assert.equal(dates.length, 42);
  assert.equal(dates[0], "2026-09-28");
  assert.equal(dates.at(-1), "2026-11-08");
  assert.deepEqual(calendarMonthDates("bad"), []);
  assert.equal(shiftCalendarMonth("2026-01-31", 1), "2026-02-28");
  assert.equal(shiftCalendarMonth("2024-01-31", 1), "2024-02-29");
  assert.equal(shiftCalendarMonth("2026-01-15", -1), "2025-12-15");
});
it("calendar choices are six valid Monday weeks, not saved activity", () => {
  assert.deepEqual(calendarWeekKeys("2026-10-07"), ["2026-10-05", "2026-09-28", "2026-09-21", "2026-09-14", "2026-09-07", "2026-08-31"]);
  assert.deepEqual(calendarWeekKeys("2026-02-31"), []);
});
