import { useId, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { UserIdentity } from "@/features/user/components/user-hover-card";
import type { Ranking } from "./types";
import { presentRankingList, type RankingRowPresentation } from "./ranking-presentation-model";
import "./ranking-presentation.css";

gsap.registerPlugin(useGSAP);

function RankingRow({ row, record, from }: { row: RankingRowPresentation; record: Ranking; from: string }) {
  const identity = useRef<HTMLDivElement>(null);
  useGSAP((_, contextSafe) => {
    const link = identity.current?.querySelector<HTMLAnchorElement>("a.user-identity");
    const arrow = link?.querySelector<SVGElement>(".user-identity__affordance");
    if (!link || !arrow || !contextSafe) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let hovered = false;
    let focused = false;
    const update = contextSafe(() => {
      gsap.to(arrow, {
        x: hovered || focused ? 3 : 0,
        opacity: hovered || focused ? 1 : .65,
        duration: reduced.matches ? 0 : .14,
        ease: "power2.out", overwrite: true,
        ...(!hovered && !focused ? { clearProps: "transform,opacity" } : {}),
      });
    });
    const enter = (event: PointerEvent) => { if (event.pointerType !== "mouse") return; hovered = true; update(); };
    const leave = () => { hovered = false; update(); };
    const focus = () => { focused = true; update(); };
    const blur = () => { focused = false; update(); };
    link.addEventListener("pointerenter", enter);
    link.addEventListener("pointerleave", leave);
    link.addEventListener("focus", focus);
    link.addEventListener("blur", blur);
    return () => {
      link.removeEventListener("pointerenter", enter);
      link.removeEventListener("pointerleave", leave);
      link.removeEventListener("focus", focus);
      link.removeEventListener("blur", blur);
    };
  }, { scope: identity, dependencies: [row.userId], revertOnUpdate: true });
  return <li className="ranking-presentation__row">
    <span className="ranking-presentation__rank">
      <span aria-hidden="true">{row.rank}</span>
      <span className="ranking-presentation__sr">{row.accessibleRank}</span>
    </span>
    <div className="ranking-presentation__identity" ref={identity}>
      <UserIdentity user={{ id: row.userId, ...record, fullName: row.fullName }} from={from} />
      <p className="ranking-presentation__count"><span aria-hidden="true">{row.approvedCount} đã duyệt</span><span className="ranking-presentation__sr">{row.approvedLabel}</span></p>
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
      <div className="ranking-presentation__columns" aria-hidden="true"><span>Hạng</span><span>Thành viên</span><span>Điểm</span></div>
      <ol className="ranking-presentation__list" aria-labelledby={contextId}>
        {presentation.rows.map((row, index) => <RankingRow key={row.userId} row={row} record={records[index]} from={presentation.from} />)}
      </ol>
    </div>
  );
}
