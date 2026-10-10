import { useId } from "react";
import { UserIdentity } from "@/features/user/components/user-hover-card";
import type { Ranking } from "./types";
import { presentRankingList } from "./ranking-presentation-model";
import "./ranking-presentation.css";

export function RankingList({ records, year, from }: { records: Ranking[]; year?: number; from: string }) {
  const contextId = useId();
  const presentation = presentRankingList(records, year, from);
  return (
    <div className="ranking-presentation content-card">
      <p className="ranking-presentation__context" id={contextId}>{presentation.contextLabel}</p>
      <ol className="ranking-presentation__list" aria-labelledby={contextId}>
        {presentation.rows.map((row, index) => (
          <li className="ranking-presentation__row" key={row.userId}>
            <span className="ranking-presentation__rank" data-tone={row.tone}>
              <span aria-hidden="true">{row.rank}</span>
              <span className="ranking-presentation__sr">{row.accessibleRank}</span>
            </span>
            <div className="ranking-presentation__identity">
              <UserIdentity user={{ id: row.userId, ...records[index], fullName: row.fullName }} from={presentation.from} />
              <p className="ranking-presentation__count">{row.approvedLabel}</p>
            </div>
            <p className="ranking-presentation__points">{row.pointsLabel}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
