import { useId } from "react";
import { UserIdentity } from "@/features/user/components/user-hover-card";
import type { Ranking } from "./types";
import { presentRankingList, type RankingRowPresentation } from "./ranking-presentation-model";
import "./ranking-presentation.css";

function RankingRow({ row, record, from }: { row: RankingRowPresentation; record: Ranking; from: string }) {
  return <li className="ranking-presentation__row" data-score-tone={row.tone}>
    <span className="ranking-presentation__rank">
      <span aria-hidden="true">{row.rank}</span>
      <span className="ranking-presentation__sr">{row.accessibleRank}</span>
    </span>
    <div className="ranking-presentation__identity">
      <UserIdentity user={{ id: row.userId, ...record, fullName: row.fullName }} from={from} showAffordance={false} />
      {row.scoreTimingKnown === false && <p className="ranking-presentation__timing">Chưa có mốc điểm cũ</p>}
    </div>
    <p className="ranking-presentation__points" aria-label={row.pointsLabel}>
      <strong>{row.totalPoints}</strong><span aria-hidden="true">điểm</span>
    </p>
  </li>;
}

export function RankingList({ records, year, from }: { records: Ranking[]; year?: number; from: string }) {
  const contextId = useId();
  const presentation = presentRankingList(records, year, from);
  return (
    <div className="ranking-presentation">
      <p className="ranking-presentation__sr" id={contextId}>{presentation.contextLabel}</p>
      <ol className="ranking-presentation__list" aria-labelledby={contextId}>
        {presentation.rows.map((row, index) => <RankingRow key={row.userId} row={row} record={records[index]} from={presentation.from} />)}
      </ol>
    </div>
  );
}
