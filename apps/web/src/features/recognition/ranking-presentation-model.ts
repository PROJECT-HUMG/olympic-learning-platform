import { publicProfilePath } from "../user/lib/public-identity.ts";

export type ScoreNameTone = "neutral" | "blue" | "teal";

export interface RankingSource {
  rank: number;
  userId: string;
  fullName: string;
  totalPoints: number;
  approvedCount: number;
  scoreTimingKnown?: boolean;
}

export interface RankingRowPresentation {
  userId: string;
  rank: number;
  tone: ScoreNameTone;
  scoreTimingKnown: boolean | undefined;
  fullName: string;
  approvedCount: number;
  totalPoints: number;
  href: string;
  accessibleRank: string;
  pointsLabel: string;
}

export interface RankingListPresentation {
  contextLabel: string;
  from: string;
  rows: RankingRowPresentation[];
}

/** Visual bands only; never ranks, awards or additional points. */
export function scoreNameTone(points: number): ScoreNameTone {
  if (points >= 50) return "teal";
  if (points >= 20) return "blue";
  return "neutral";
}

export function rankingContextLabel(year?: number): string {
  if (typeof year === "number" && Number.isInteger(year)) return `Năm ${year}`;
  return "Tất cả thời gian";
}

export function presentRankingList(records: readonly RankingSource[], year: number | undefined, from: string): RankingListPresentation {
  const contextLabel = rankingContextLabel(year);
  return {
    contextLabel,
    from,
    rows: records.map((record) => ({
      userId: record.userId,
      rank: record.rank,
      tone: scoreNameTone(record.totalPoints),
      scoreTimingKnown: record.scoreTimingKnown,
      fullName: record.fullName,
      approvedCount: record.approvedCount,
      totalPoints: record.totalPoints,
      href: publicProfilePath(record.userId),
      accessibleRank: `Hạng ${record.rank}, ${contextLabel}`,
      pointsLabel: `${record.totalPoints} điểm nền tảng`,
    })),
  };
}
