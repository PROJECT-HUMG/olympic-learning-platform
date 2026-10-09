import { parsePlatformDate } from "./platform-calendar.ts";

const INSTANT = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;

/** Validate a real date/time with an explicit zone; preserve the wire spelling. */
export function explicitInstant(value: unknown): string | null {
  if (typeof value !== "string" || !INSTANT.test(value)) return null;
  const match = INSTANT.exec(value);
  if (!match || !parsePlatformDate(match[1])) return null;
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  const second = Number(match[4]);
  if (hour > 23 || minute > 59 || second > 59) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}
