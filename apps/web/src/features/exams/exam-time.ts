const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function localParts(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function browserTimeZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && zone.length > 0 ? zone : "UTC";
  } catch {
    return "UTC";
  }
}

export function zoneLabel(zone = browserTimeZone()): string {
  return `Múi giờ trình duyệt: ${zone}`;
}

export function offsetDateTimeToLocalInput(value: string | null): string {
  if (value === null || value.trim() === "") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return localParts(date);
}

/** datetime-local carries no zone. The offset is the browser offset of that instant. */
export function localInputToOffsetDateTime(value: string): string | null {
  if (value.trim() === "") return null;
  if (!LOCAL_INPUT.test(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || localParts(date) !== value) return null;
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const absolute = Math.abs(offset);
  return `${value}:00${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

export function formatRelease(value: string | null, zone = browserTimeZone()): string {
  if (value === null || value.trim() === "") return "Chưa đặt giờ mở";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa đặt giờ mở";
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    hourCycle: "h23", timeZone: zone, timeZoneName: "short",
  }).format(date);
}
