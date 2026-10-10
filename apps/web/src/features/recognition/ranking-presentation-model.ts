import { publicProfilePath } from "../user/lib/public-identity.ts";

export type RankTone = "gold" | "silver" | "bronze" | "neutral";

export interface RankingSource {
  rank: number;
  userId: string;
  fullName: string;
  totalPoints: number;
  approvedCount: number;
}

export interface RankingRowPresentation {
  userId: string;
  rank: number;
  tone: RankTone;
  fullName: string;
  approvedCount: number;
  totalPoints: number;
  href: string;
  accessibleRank: string;
  approvedLabel: string;
  pointsLabel: string;
}

export interface RankingListPresentation {
  contextLabel: string;
  from: string;
  rows: RankingRowPresentation[];
}

export function rankTone(rank: number): RankTone {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
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
      tone: rankTone(record.rank),
      fullName: record.fullName,
      approvedCount: record.approvedCount,
      totalPoints: record.totalPoints,
      href: publicProfilePath(record.userId),
      accessibleRank: `Hạng ${record.rank}, ${contextLabel}`,
      approvedLabel: `${record.approvedCount} thành tích đã duyệt`,
      pointsLabel: `${record.totalPoints} điểm nền tảng`,
    })),
  };
}
