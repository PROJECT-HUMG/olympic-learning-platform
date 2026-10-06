import { addPlatformDays, parsePlatformDate, platformDateKey, weekDates } from "./platform-calendar.ts";

/** An explicit (even invalid) date must never silently become today. */
export function dailyEntryDate(requested: string | null, today: string): string {
  return requested ?? today;
}

export function calendarMonthDates(date: string): string[] {
  const parsed = parsePlatformDate(date);
  if (!parsed) return [];
  const start = weekDates({ ...parsed, day: 1 })[0];
  return Array.from({ length: 42 }, (_, index) => platformDateKey(addPlatformDays(start, index)));
}

/** Keep the day where possible; Jan 31 -> Feb 28, not a date in March. */
export function shiftCalendarMonth(date: string, offset: number): string {
  const parsed = parsePlatformDate(date);
  if (!parsed) return date;
  const start = new Date(Date.UTC(parsed.year, parsed.month - 1 + offset, 1));
  const last = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const next = platformDateKey({ year: start.getUTCFullYear(), month: start.getUTCMonth() + 1, day: Math.min(parsed.day, last) });
  return parsePlatformDate(next) ? next : date;
}
