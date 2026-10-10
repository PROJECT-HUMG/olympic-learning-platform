import { AWARDS, CATEGORIES, STATUS_LABELS } from "./scoring.ts";
import type { PublicAchievement, Award, Category } from "./types.ts";

export const EDITORIAL_HONOR_LABEL = "Được vinh danh";
export const PUBLIC_LABEL_PREVIEW_LIMIT = 2;

export interface PublicAchievementLabel {
  id: string;
  category: string;
  award: string;
  year: number | null;
}

export interface PublicAchievementMilestone {
  id: string;
  title: string;
  description: string | null;
  dateText: string;
  category: string;
  award: string;
  approvedText: string;
  participationText: string | null;
  pointsText: string | null;
}

export interface MilestoneYearGroup {
  year: number | null;
  records: PublicAchievementMilestone[];
}

export interface PublicLabelSplit {
  visible: PublicAchievementLabel[];
  overflow: PublicAchievementLabel[];
  hiddenCount: number;
}

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s].*)/;

function calendarParts(value: string): { year: number; month: number; day: number; iso: string } | null {
  if (typeof value !== "string") return null;
  const match = CALENDAR_DATE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const iso = `${match[1]}-${match[2]}-${match[3]}`;
  const utc = new Date(`${iso}T00:00:00Z`);
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() + 1 !== month || utc.getUTCDate() !== day) return null;
  return { year, month, day, iso };
}

// Approved and publicly visible only. Description and participation are copied after this filter. Totals and ranking opt-in do not grant a public label or card.
export function isPublicAchievement(record: PublicAchievement): boolean {
  return !!record && record.status === "APPROVED" && record.publicVisible === true;
}

// Later calendar dates come first. The same day uses the raw timestamp, then id, so input order cannot change the result.
function comparePublicChronological(left: PublicAchievement, right: PublicAchievement): number {
  const leftDate = calendarParts(left.achievedDate)?.iso ?? null;
  const rightDate = calendarParts(right.achievedDate)?.iso ?? null;
  if (leftDate && rightDate && leftDate !== rightDate) return leftDate < rightDate ? 1 : -1;
  if (leftDate && !rightDate) return -1;
  if (!leftDate && rightDate) return 1;
  const leftStamp = typeof left.achievedDate === "string" ? left.achievedDate : "";
  const rightStamp = typeof right.achievedDate === "string" ? right.achievedDate : "";
  if (leftDate && rightDate && leftStamp !== rightStamp) return leftStamp < rightStamp ? 1 : -1;
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

function orderedPublic(records: readonly PublicAchievement[]): PublicAchievement[] {
  const source = Array.isArray(records) ? records : [];
  return source.filter(isPublicAchievement).slice().sort(comparePublicChronological);
}

function categoryText(category: Category): string {
  return CATEGORIES[category] ?? category;
}

function awardText(award: Award): string {
  return AWARDS[award] ?? award;
}

function toLabel(record: PublicAchievement): PublicAchievementLabel {
  return {
    id: record.id,
    category: categoryText(record.category),
    award: awardText(record.award),
    year: calendarParts(record.achievedDate)?.year ?? null,
  };
}

function formatDate(value: string): string {
  const parts = calendarParts(value);
  if (!parts) return "Ngày chưa rõ";
  return `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}/${parts.year}`;
}

function formatPoints(points: number): string | null {
  if (!Number.isFinite(points)) return null;
  return `${points} điểm nền tảng`;
}

function formatParticipation(record: PublicAchievement): string | null {
  if (record.includeParticipation !== true) return null;
  if (!Number.isFinite(record.awardPoints) || !Number.isFinite(record.participationPoints)) return null;
  return `Gồm ${record.awardPoints} điểm giải và ${record.participationPoints} điểm tham gia.`;
}

function toMilestone(record: PublicAchievement): PublicAchievementMilestone {
  return {
    id: record.id,
    title: record.title,
    description: record.description ? record.description : null,
    dateText: formatDate(record.achievedDate),
    category: categoryText(record.category),
    award: awardText(record.award),
    approvedText: STATUS_LABELS.APPROVED,
    participationText: formatParticipation(record),
    pointsText: formatPoints(record.totalPoints),
  };
}

export function presentPublicLabels(records: readonly PublicAchievement[]): PublicLabelSplit {
  const labels = orderedPublic(records).map(toLabel);
  const visible = labels.slice(0, PUBLIC_LABEL_PREVIEW_LIMIT);
  const overflow = labels.slice(PUBLIC_LABEL_PREVIEW_LIMIT);
  return { visible, overflow, hiddenCount: overflow.length };
}

export function publicLabelControlLabel(hiddenCount: number, expanded: boolean): string {
  return expanded ? "Thu gọn nhãn thành tích" : `Xem thêm ${hiddenCount} nhãn thành tích công khai`;
}

export function presentMilestones(records: readonly PublicAchievement[]): MilestoneYearGroup[] {
  const groups: MilestoneYearGroup[] = [];
  for (const record of orderedPublic(records)) {
    const year = calendarParts(record.achievedDate)?.year ?? null;
    const milestone = toMilestone(record);
    const current = groups[groups.length - 1];
    if (!current || current.year !== year) groups.push({ year, records: [milestone] });
    else current.records.push(milestone);
  }
  return groups;
}
