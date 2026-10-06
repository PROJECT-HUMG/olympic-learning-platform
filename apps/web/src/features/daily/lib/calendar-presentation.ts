import { addPlatformDays, parsePlatformDate, platformDateKey, weekDates } from "./platform-calendar.ts";

/** History contains saved weeks only. A calendar choice never creates history. */
export function plannedWeekKeys(dates: readonly string[]): string[] {
  const keys = dates.flatMap(date => {
    const parsed = parsePlatformDate(date);
    return parsed ? [platformDateKey(weekDates(parsed)[0])] : [];
  });
  return [...new Set(keys)].sort((a, b) => b.localeCompare(a));
}

export function calendarWeekKeys(date: string): string[] {
  const parsed = parsePlatformDate(date);
  if (!parsed) return [];
  const monday = weekDates(parsed)[0];
  return [0, -1, -2, -3, -4, -5].map(offset => platformDateKey(addPlatformDays(monday, offset * 7)));
}
