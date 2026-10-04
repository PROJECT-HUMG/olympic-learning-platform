/** Fixed platform civil time. Asia/Ho_Chi_Minh has no daylight-saving shift. */
export const PLATFORM_TIME_ZONE = "Asia/Ho_Chi_Minh";
export const PLATFORM_OFFSET_MINUTES = 7 * 60;
export const FIRST_SUBMIT_CUTOFF = "07:30";

export interface PlatformDate {
  year: number;
  month: number;
  day: number;
}

export type SubmitTiming = "UNSUBMITTED" | "ON_TIME" | "LATE";

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}

export function platformDateKey(date: PlatformDate): string {
  return `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}`;
}

export function parsePlatformDate(value: string): PlatformDate | null {
  const match = DATE_KEY.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isRealDate(year, month, day)) return null;
  return { year, month, day };
}

/** Calendar date of an instant in UTC+7, independent of the browser zone. */
export function platformDate(instant: string | Date): PlatformDate | null {
  const date = instant instanceof Date ? instant : new Date(instant);
  const time = date.getTime();
  if (Number.isNaN(time)) return null;
  const shifted = new Date(time + PLATFORM_OFFSET_MINUTES * 60 * 1000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

export function addPlatformDays(date: PlatformDate, days: number): PlatformDate {
  const probe = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: probe.getUTCFullYear(), month: probe.getUTCMonth() + 1, day: probe.getUTCDate() };
}

/** Monday is 0 and Sunday is 6 for the civil date. */
export function mondayIndex(date: PlatformDate): number {
  const probe = new Date(Date.UTC(date.year, date.month - 1, date.day));
  return (probe.getUTCDay() + 6) % 7;
}

export function weekDates(date: PlatformDate): PlatformDate[] {
  const start = addPlatformDays(date, -mondayIndex(date));
  return Array.from({ length: 7 }, (_, index) => addPlatformDays(start, index));
}

/** 07:30 Asia/Ho_Chi_Minh is 00:30 UTC on that civil date. */
export function firstSubmitCutoffEpoch(planDate: PlatformDate): number {
  return Date.UTC(planDate.year, planDate.month - 1, planDate.day, 0, 30, 0, 0);
}

/** Classifies the first submission only. Later edits are not an input and do not move the cutoff. */
export function classifyFirstSubmit(planDate: PlatformDate, firstSubmittedAt: string | null): { timing: SubmitTiming; usable: true } {
  if (firstSubmittedAt === null || firstSubmittedAt.trim() === "") return { timing: "UNSUBMITTED", usable: true };
  const submitted = new Date(firstSubmittedAt).getTime();
  if (Number.isNaN(submitted)) return { timing: "UNSUBMITTED", usable: true };
  const timing = submitted <= firstSubmitCutoffEpoch(planDate) ? "ON_TIME" : "LATE";
  return { timing, usable: true };
}
